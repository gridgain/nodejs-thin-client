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
        this._currentReq = null;
        this._lastLine = 0;
        this._file = file;
    }

    get currentReq() {
        return this._currentReq;
    }

    async nextRequest() {
        let stream = null;
        try {
            stream = fs.createReadStream(this._file);
            let readInterface = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });
    
            let i = -1;
            for await (const line of readInterface) {
                ++i;
                if (i <= this._lastLine)
                    continue;
                else
                    this._lastLine = i;

                const res = line.match(/Client request received .*?req=org.apache.ignite.internal.processors.platform.client.cache.ClientCache([a-zA-Z]+)Request@/);
                if (res) {
                    this._currentReq = res[1].normalize();
                    return this._currentReq;
                }
            }
            return null;
        }
        catch (_error) {
            return null;
        }
        finally {
            if (stream)
                stream.close();
        }
    }
}

module.exports = LogReader;
