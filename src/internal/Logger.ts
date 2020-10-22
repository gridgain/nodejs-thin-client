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

/** Utility class for logging errors and debug messages. */
export default class Logger {

    private static _debug: boolean = false;

    static get debug(): boolean {
        return Logger._debug;
    }

    static set debug(value: boolean) {
        Logger._debug = value;
    }

    static logDebug(data: string, ...args: any[]) {
        if (Logger._debug) {
            console.log(data, ...args);
        }
    }

    static logError(data: string, ...args: any[]) {
        if (Logger._debug) {
            console.log('ERROR: ' + data, ...args);
        }
    }
}
