/*
Copyright 2017 Google Inc.

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

import { logger } from '../../logger';
import { getQueueSingleton, processKnownTasks } from '../util';

export function startProcessing() {
  const queue = getQueueSingleton();

  processKnownTasks();

  queue.on('job enqueue', (id: number, type: string) => {
    logger.info(`${type} Job queued: ${id}`);
  });

  queue.on('job complete', (id: number) => {
    logger.info(`Job complete: ${id}`);
  });

  queue.on('job failed', (err: any) => {
    logger.error(`Job failed: ${err}`);
  });

  queue.on('error', (err: any) => {
    logger.error(`Worker queue error: ${err}`);
  });

  // Check for stuck jobs every 10 seconds

  queue.watchStuckJobs(10000);

  // Graceful shutdown

  process.once('SIGTERM', () => {
    queue.shutdown(10000, '', (err: any) => {
      if (err) {
        logger.error(`Worker queue shutdown error: ${err}`);
      } else {
        logger.info('Worker queue shut down successfully');
      }
      process.exit(0);
    });
  });
}

export { heartbeatTask } from './heartbeat';
export { CommentActions, enqueueCommentAction } from './comment_actions';
export {
  enqueueAddTagTask,
  enqueueConfirmTagTask,
  enqueueRejectTagTask,
  enqueueRemoveTagTask,
  enqueueResetTagTask,
} from './score_tag_actions';
export { enqueueProcessMachineScoreTask } from './process_machine_score';
export { enqueueSendCommentForScoringTask } from './send_comment_for_scoring';
export { enqueueScoreAction, ScoreActions } from './score_actions';
export {
  enqueueProcessTagAdditionTask,
  enqueueProcessTagRevocationTask,
  IProcessTagAdditionData,
  IProcessTagData,
} from './process_tagging';
