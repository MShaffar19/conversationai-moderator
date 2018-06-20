/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {google} from 'googleapis';
import * as yargs from 'yargs';

import {Article, Category, logger} from '@conversationai/moderator-backend-core';

import {authorize} from './authenticate';
import {mapCommentThreadToComments} from './objectmap';

export const command = 'youtube:syncComments';
export const describe = 'Sync youtube comment threads with OSMod comments.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Sync youtube comment threads:\n' +
      'node $0 youtube:syncComments');
}

export async function handler() {
  authorize((auth) => {
    const service = google.youtube('v3');

    Category.findAll({
      where: {
        sourceId: {ne: null},
        isActive: true,
      },
    }).then((result) => {
      for (const category of result) {
        const categoryId = category.get('id');
        const channelId = category.get('sourceId');

        Article.findAll({
          where: {
            categoryId: categoryId,
          },
          attributes: ['id', 'sourceId'],
        }).then((results) => {
          const articleIdMap = new Map<string, number>();
          for (const a of results) {
            articleIdMap.set(a.get('sourceId'), a.id);
          }

          service.commentThreads.list({
            auth: auth,
            allThreadsRelatedToChannelId: channelId,
            part: 'snippet,replies',
            textFormat: 'plainText',
            // TODO: need to also set maxResults and pageToken to only get new comments.
            // TODO: Set moderationStatus: heldForReview to only get unmoderated comments?
            //
          }, (err: any, response: any) => {
            if (err) {
              logger.error('Google API returned an error: ' + err);
              return;
            }
            if (response!.data.items.length === 0) {
              logger.info('Couldn\'t find any threads for channel %s.', channelId);
              return;
            }

            for (const t of response!.data.items) {
              mapCommentThreadToComments(articleIdMap, t);
            }
          });
        });
      }
    });
  });
}
