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

const Util = require('util');

/**
 * Base GridGain client error class.
 */
export class IgniteClientError extends Error {
    constructor(message) {
        super(message);
    }

    /**
     * GridGain client does not support one of the specified or received data types.
     * @ignore
     */
    static unsupportedTypeError(type) {
        const BinaryUtils = require('./internal/BinaryUtils');
        return new IgniteClientError(Util.format('Type %s is not supported', BinaryUtils.getTypeName(type)));
    }

    /**
     * The real type of data is not equal to the specified one.
     * @ignore
     */
    static typeCastError(fromType, toType) {
        const BinaryUtils = require('./internal/BinaryUtils');
        return new IgniteClientError(Util.format('Type "%s" can not be cast to %s',
            BinaryUtils.getTypeName(fromType), BinaryUtils.getTypeName(toType)));
    }

    /**
     * The real value can not be cast to the specified type.
     * @ignore
     */
    static valueCastError(value, toType) {
        const BinaryUtils = require('./internal/BinaryUtils');
        return new IgniteClientError(Util.format('Value "%s" can not be cast to %s',
            value, BinaryUtils.getTypeName(toType)));
    }

    /**
     * An illegal or inappropriate argument has been passed to the API method.
     * @ignore
     */
    static illegalArgumentError(message) {
        return new IgniteClientError(message);
    }

    /**
     * GridGain client internal error.
     * @ignore
     */
    static internalError(message = null) {
        return new IgniteClientError(message || 'Internal library error');
    }

    /**
     * Serialization/deserialization errors.
     * @ignore
     */
    static serializationError(serialize, message = null) {
        let msg = serialize ? 'Complex object can not be serialized' : 'Complex object can not be deserialized';
        if (message) {
            msg = msg + ': ' + message;
        }
        return new IgniteClientError(msg);
    }

    /**
     * EnumItem serialization/deserialization errors.
     * @ignore
     */
    static enumSerializationError(serialize, message = null) {
        let msg = serialize ? 'Enum item can not be serialized' : 'Enum item can not be deserialized';
        if (message) {
            msg = msg + ': ' + message;
        }
        return new IgniteClientError(msg);
    }
}

/**
 * GridGain server returns error for the requested operation.
 * @extends IgniteClientError
 */
export class OperationError extends IgniteClientError {
    constructor(message) {
        super(message);
    }
}

/**
 * GridGain client is not in an appropriate state for the requested operation.
 * @extends IgniteClientError
 */
export class IllegalStateError extends IgniteClientError {
    constructor(state, message = null) {
        super(message || 'GridGain client is not in an appropriate state for the requested operation. Current state: ' + state);
    }
}

/**
 * The requested operation is not completed due to the connection lost.
 * @extends IgniteClientError
 */
export class LostConnectionError extends IgniteClientError {
    constructor(message = null) {
        super(message || 'Request is not completed due to the connection lost');
    }
}
