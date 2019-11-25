/*
 * Copyright 2019 GridGain Systems, Inc. and Contributors.
 *
 * Licensed under the GridGain Community Edition License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.gridgain.com/products/software/community-edition/gridgain-community-edition-license
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const fs = require('fs');
const readline = require('readline');

// Helper class for working with GG logs
class LogReader {
    constructor(file) {
        this._lastLine = 0;
        this._file = file;
    }

    async nextRequest() {
        let stream = null;
        let readInterface = null;

        let cleanUp = () => {
            if (stream) {
                stream.close();
                stream = null;
            }

            if (readInterface) {
                readInterface.close();
                readInterface = null;
            }
        }

        return await new Promise((resolve) => {
            stream = fs.createReadStream(this._file);
            readInterface = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });

            let resolved = false;

            let i = -1;
            readInterface.on('line', (line) => {
                if (resolved)
                    return;

                ++i;
                if (i <= this._lastLine)
                    return;

                this._lastLine = i;

                const res = line.match(/Client request received .*?req=org.apache.ignite.internal.processors.platform.client.cache.ClientCache([a-zA-Z]+)Request@/);
                if (res) {
                    resolved = true;
                    cleanUp();
                    resolve(res[1].normalize());
                }
            });

            readInterface.on('close', () => {
                cleanUp();
                if (!resolved)
                    resolve(null);
            });
        })
        .catch((_err) => {});
    }
}

module.exports = LogReader;
