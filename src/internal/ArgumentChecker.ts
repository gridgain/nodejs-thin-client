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

import * as Util from 'util';
import {IgniteClientError} from "../Errors";

/** Helper class for the library methods arguments check. */
export default class ArgumentChecker {
    static notEmpty(arg, argName) {
        if (!arg || arg instanceof Array && arg.length === 0) {
            throw IgniteClientError.illegalArgumentError(Util.format('"%s" argument should not be empty', argName));
        }
    }

    static notNull(arg, argName) {
        if (arg === null || arg === undefined) {
            throw IgniteClientError.illegalArgumentError(Util.format('"%s" argument should not be null', argName));
        }
    }

    static hasType(arg, argName, isArray, ...types) {
        if (arg === null) {
            return;
        }
        if (isArray && arg instanceof Array) {
            for (let a of arg) {
                ArgumentChecker.hasType(a, argName, false, ...types);
            }
        }
        else {
            for (let type of types) {
                if (arg instanceof type) {
                    return;
                }
            }
            throw IgniteClientError.illegalArgumentError(Util.format('"%s" argument has incorrect type', argName));
        }
    }

    static hasValueFrom(arg, argName, isArray, values) {
        if (isArray && arg instanceof Array) {
            for (let a of arg) {
                ArgumentChecker.hasValueFrom(a, argName, false, values);
            }
        }
        else {
            if (!Object.values(values).includes(arg)) {
                throw IgniteClientError.illegalArgumentError(Util.format('"%s" argument has incorrect value', argName));
            }
        }
    }

    static isInteger(arg, argName) {
        if (arg === null || arg === undefined || !Number.isInteger(arg)) {
            throw IgniteClientError.illegalArgumentError(Util.format('"%s" argument should be integer', argName));
        }
    }

    static invalidArgument(arg, argName, type) {
        if (arg !== null && arg !== undefined) {
            throw IgniteClientError.illegalArgumentError(
                Util.format('"%s" argument is invalid for %s', argName, type.constructor.name));
        }
    }
}
