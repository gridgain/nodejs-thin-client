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

import * as Util from "util";
import ArgumentChecker from "./internal/ArgumentChecker";
import { IgniteClientError } from "./Errors";
import BinaryCommunicator from "./internal/BinaryCommunicator";
import MessageBuffer from "./internal/MessageBuffer";

/**
 * Class representing an item of GridGain enum type.
 *
 * The item is defined by:
 *   - type Id (mandatory) - Id of the GridGain enum type.
 *   - ordinal (optional) - ordinal of the item in the GridGain enum type.
 *   - name (optional) - name of the item (field name in the GridGain enum type).
 *   - value (optional) - value of the item.
 * Usually, at least one from the optional ordinal, name or value must be specified
 * in order to use an instance of this class in GridGain operations.
 *
 * To distinguish one item from another, the GridGain client analyzes the optional fields in the following order:
 * ordinal, name, value.
 */
export class EnumItem {

    private _typeId: number;

    private _ordinal: number;

    private _name: string;

    private _value: number;

    /**
     * Public constructor.
     *
     * @param {number} typeId - Id of the GridGain enum type.
     *
     * @return {EnumItem} - new EnumItem instance
     *
     * @throws {IgniteClientError} if error.
     */
    constructor(typeId: number) {
        this.setTypeId(typeId);
        this._ordinal = null;
        this._name = null;
        this._value = null;
    }

    /**
     * Returns Id of the GridGain enum type.
     *
     * @return {number} - Id of the enum type.
     */
    getTypeId(): number {
        return this._typeId;
    }

    /**
     * Updates Id of the GridGain enum type.
     *
     * @param {number} typeId - new Id of the GridGain enum type.
     *
     * @return {EnumItem} - the same instance of EnumItem
     *
     * @throws {IgniteClientError} if error.
     */
    setTypeId(typeId: number): EnumItem {
        ArgumentChecker.isInteger(typeId, 'typeId');
        this._typeId = typeId;
        return this;
    }

    /**
     * Returns ordinal of the item in the GridGain enum type
     * or null if ordinal is not set.
     *
     * @return {number} - ordinal of the item in the GridGain enum type.
     */
    getOrdinal(): number {
        return this._ordinal;
    }

    /**
     * Sets or updates ordinal of the item in the GridGain enum type.
     *
     * @param {number} ordinal - ordinal of the item in the GridGain enum type.
     *
     * @return {EnumItem} - the same instance of EnumItem
     *
     * @throws {IgniteClientError} if error.
     */
    setOrdinal(ordinal: number): EnumItem {
        ArgumentChecker.isInteger(ordinal, 'ordinal');
        this._ordinal = ordinal;
        return this;
    }

    /**
     * Returns name of the item
     * or null if name is not set.
     *
     * @return {string} - name of the item.
     */
    getName(): string {
        return this._name;
    }

    /**
     * Sets or updates name of the item.
     *
     * @param {string} name - name of the item.
     *
     * @return {EnumItem} - the same instance of EnumItem
     *
     * @throws {IgniteClientError} if error.
     */
    setName(name: string): EnumItem {
        ArgumentChecker.notEmpty(name, 'name');
        this._name = name;
        return this;
    }

    /**
     * Returns value of the item
     * or null if value is not set.
     *
     * @return {number} - value of the item.
     */
    getValue(): number {
        return this._value;
    }

    /**
     * Sets or updates value of the item.
     *
     * @param {number} value - value of the item.
     *
     * @return {EnumItem} - the same instance of EnumItem
     *
     * @throws {IgniteClientError} if error.
     */
    setValue(value: number): EnumItem {
        ArgumentChecker.isInteger(value, 'value');
        this._value = value;
        return this;
    }

    /** Private methods */

    /**
     * @ignore
     */
    async _write(communicator: BinaryCommunicator, buffer: MessageBuffer) {
        const type = await this._getType(communicator, this._typeId);
        if (!type || !type.isEnum) {
            throw IgniteClientError.enumSerializationError(
                true, Util.format('enum type id "%d" is not registered', this._typeId));
        }
        buffer.writeInteger(this._typeId);
        if (this._ordinal !== null) {
            buffer.writeInteger(this._ordinal);
            return;
        }
        else if (this._name !== null || this._value !== null) {
            if (type.enumValues) {
                for (let i = 0; i < type.enumValues.length; i++) {
                    if (this._name === type.enumValues[i][0] ||
                        this._value === type.enumValues[i][1]) {
                        buffer.writeInteger(i);
                        return;
                    }
                }
            }
        }
        throw IgniteClientError.illegalArgumentError(
            'Proper ordinal, name or value must be specified for EnumItem');
    }

    /**
     * @ignore
     */
    async _read(communicator: BinaryCommunicator, buffer: MessageBuffer) {
        this._typeId = buffer.readInteger();
        this._ordinal = buffer.readInteger();
        const type = await this._getType(communicator, this._typeId);
        if (!type || !type.isEnum) {
            throw IgniteClientError.enumSerializationError(
                false, Util.format('enum type id "%d" is not registered', this._typeId));
        }
        else if (!type.enumValues || type.enumValues.length <= this._ordinal) {
            throw IgniteClientError.enumSerializationError(false, 'type mismatch');
        }
        this._name = type.enumValues[this._ordinal][0];
        this._value = type.enumValues[this._ordinal][1];
    }

    /**
     * @ignore
     */
    async _getType(communicator: BinaryCommunicator, typeId: number) {
        return await communicator.typeStorage.getType(typeId);
    }
}
