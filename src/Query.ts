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
import {BaseCursor, Cursor, SqlFieldsCursor} from "./Cursor";
import ArgumentChecker from "./internal/ArgumentChecker";
import BinaryCommunicator from "./internal/BinaryCommunicator";
import BinaryUtils, {OPERATION} from "./internal/BinaryUtils";
import { CompositeType } from "./ObjectType";
import { PRIMITIVE_TYPE } from "./internal/Constants";
import MessageBuffer from "./internal/MessageBuffer";
import {CacheEntry} from "./CacheClient";

const PAGE_SIZE_DEFAULT = 1024;

const DeprecateSetLocal = Util.deprecate(() => {}, "Query.setLocal is deprecated. It will be removed in later versions.");

/**
 * Base class representing a GridGain SQL or Scan query.
 *
 * The class has no public constructor. Only subclasses may be instantiated.
 *
 * @hideconstructor
 */
abstract class Query<T> {

    protected _local: boolean;

    protected _pageSize: number;

    protected _operation: OPERATION;

    /**
     * Set local query flag.
     *
     * @param {boolean} local - local query flag: true or false.
     *
     * @return {Query} - the same instance of the Query.
     *
     * @deprecated Will be removed in later versions.
     */
    setLocal(local: boolean): Query<T> {
        DeprecateSetLocal();
        this._local = local;
        return this;
    }

    /**
     * Set {@link Cursor} page size.
     *
     * @param {number} pageSize - cursor page size.
     *
     * @return {Query} - the same instance of the Query.
     */
    setPageSize(pageSize: number): Query<T> {
        this._pageSize = pageSize;
        return this;
    }

    /** Private methods */

    /**
     * @ignore
     */
    constructor(operation: OPERATION) {
        this._operation = operation;
        this._local = false;
        this._pageSize = PAGE_SIZE_DEFAULT;
    }

    abstract _getCursor(communicator, payload, keyType, valueType): Promise<BaseCursor<T>>;
}

/**
 * Class representing an SQL query which returns the whole cache entries (key-value pairs).
 * @extends Query
 */
export class SqlQuery extends Query<CacheEntry> {
    
    private _type: string;
    
    protected _sql: string;
    
    private _argTypes: PRIMITIVE_TYPE[] | CompositeType[];
    
    protected _distributedJoins: boolean;
    
    protected _replicatedOnly: boolean;
    
    protected _timeout: number;
    
    private _args: object[];

    /**
     * Public constructor.
     *
     * Requires name of a type (or SQL table) and SQL query string to be specified.
     * Other SQL query settings have the following defaults:
     * <pre>
     *     SQL Query setting         :    Default value
     *     Local query flag          :    false
     *     Cursor page size          :    1024
     *     Query arguments           :    not specified
     *     Distributed joins flag    :    false
     *     Replicated only flag      :    false
     *     Timeout                   :    0 (disabled)
     * </pre>
     * Every setting may be changed using set methods.
     *
     * @param {string} type - name of a type or SQL table.
     * @param {string} sql - SQL query string.
     *
     * @return {SqlQuery} - new SqlQuery instance.
     */
    constructor(type: string, sql: string) {
        super(BinaryUtils.OPERATION.QUERY_SQL);
        this.setType(type);
        this.setSql(sql);
        this._args = null;
        this._argTypes = null;
        this._distributedJoins = false;
        this._replicatedOnly = false;
        this._timeout = 0;
    }

    /**
     * Set name of a type or SQL table.
     *
     * @param {string} type - name of a type or SQL table.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setType(type: string): SqlQuery {
        if (this instanceof SqlFieldsQuery) {
            ArgumentChecker.invalidArgument(type, 'type', SqlFieldsQuery);
        }
        else {
            ArgumentChecker.notNull(type, 'type');
        }
        this._type = type;
        return this;
    }

    /**
     * Set SQL query string.
     *
     * @param {string} sql - SQL query string.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setSql(sql: string): SqlQuery {
        ArgumentChecker.notNull(sql, 'sql');
        this._sql = sql;
        return this;
    }

    /**
     * Set query arguments.
     *
     * Type of any argument may be specified using setArgTypes() method.
     * If type of an argument is not specified then during operations the GridGain client
     * will try to make automatic mapping between JavaScript types and GridGain object types -
     * according to the mapping table defined in the description of the {@link ObjectType} class.
     *
     * @param {...*} args - Query arguments.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setArgs(...args: object[]): SqlQuery {
        this._args = args;
        return this;
    }

    /**
     * Specifies types of query arguments.
     *
     * Query arguments itself are set using setArgs() method.
     * By default, a type of every argument is not specified that means during operations the GridGain client
     * will try to make automatic mapping between JavaScript types and GridGain object types -
     * according to the mapping table defined in the description of the {@link ObjectType} class.
     *
     * @param {...ObjectType.PRIMITIVE_TYPE | CompositeType} argTypes - types of Query arguments.
     *   The order of types must follow the order of arguments in the setArgs() method.
     *   A type of every argument can be:
     *   - either a type code of primitive (simple) type
     *   - or an instance of class representing non-primitive (composite) type
     *   - or null (means the type is not specified)
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setArgTypes(...argTypes: PRIMITIVE_TYPE[] | CompositeType[]): SqlQuery {
        this._argTypes = argTypes;
        return this;
    }

    /**
     * Set distributed joins flag.
     *
     * @param {boolean} distributedJoins - distributed joins flag: true or false.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setDistributedJoins(distributedJoins: boolean): SqlQuery {
        this._distributedJoins = distributedJoins;
        return this;
    }

    /**
     * Set replicated only flag.
     *
     * @param {boolean} replicatedOnly - replicated only flag: true or false.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setReplicatedOnly(replicatedOnly: boolean): SqlQuery {
        this._replicatedOnly = replicatedOnly;
        return this;
    }

    /**
     * Set timeout.
     *
     * @param {number} timeout - timeout value in milliseconds.
     *   Must be non-negative. Zero value disables timeout.
     *
     * @return {SqlQuery} - the same instance of the SqlQuery.
     */
    setTimeout(timeout: number): SqlQuery {
        this._timeout = timeout;
        return this;
    }

    /** Private methods */

    /**
     * @ignore
     */
    async _write(communicator: BinaryCommunicator, buffer: MessageBuffer) {
        BinaryCommunicator.writeString(buffer, this._type);
        BinaryCommunicator.writeString(buffer, this._sql);
        await this._writeArgs(communicator, buffer);
        buffer.writeBoolean(this._distributedJoins);
        buffer.writeBoolean(this._local);
        buffer.writeBoolean(this._replicatedOnly);
        buffer.writeInteger(this._pageSize);
        buffer.writeLong(this._timeout);
    }

    /**
     * @ignore
     */
    async _writeArgs(communicator: BinaryCommunicator, buffer: MessageBuffer) {
        const argsLength = this._args ? this._args.length : 0;
        buffer.writeInteger(argsLength);
        if (argsLength > 0) {
            let argType;
            for (let i = 0; i < argsLength; i++) {
                argType = this._argTypes && i < this._argTypes.length ? this._argTypes[i] : null;
                await communicator.writeObject(buffer, this._args[i], argType);
            }
        }
    }

    /**
     * @ignore
     */
    async _getCursor(communicator, payload, keyType = null, valueType = null): Promise<BaseCursor<CacheEntry>> {
        const cursor = new Cursor(communicator, BinaryUtils.OPERATION.QUERY_SQL_CURSOR_GET_PAGE, payload, keyType, valueType);
        cursor._readId(payload);
        return cursor;
    }
}

/**
 * Statement type of SQL Fields query.
 * @typedef SqlFieldsQuery.STATEMENT_TYPE
 * @enum
 * @readonly
 * @property ANY 0
 * @property SELECT 1
 * @property UPDATE 2
 */
export enum STATEMENT_TYPE {
    ANY = 0,
    SELECT = 1,
    UPDATE = 2
}


/**
 * Class representing an SQL Fields query.
 * @extends SqlQuery
 */
export class SqlFieldsQuery extends SqlQuery {
    
    private _schema: string;
    
    private _maxRows: number;

    private _statementType: STATEMENT_TYPE;

    private _enforceJoinOrder: boolean;

    private _collocated: boolean;

    private _lazy: boolean;

    private _includeFieldNames: boolean;

    /**
     * Public constructor.
     *
     * Requires SQL query string to be specified.
     * Other SQL Fields query settings have the following defaults:
     * <pre>
     *     SQL Fields Query setting  :    Default value
     *     Local query flag          :    false
     *     Cursor page size          :    1024
     *     Query arguments           :    not specified
     *     Distributed joins flag    :    false
     *     Replicated only flag      :    false
     *     Timeout                   :    0 (disabled)
     *     Schema for the query      :    not specified
     *     Max rows                  :    -1
     *     Statement type            :    STATEMENT_TYPE.ANY
     *     Enforce join order flag   :    false
     *     Collocated flag           :    false
     *     Lazy query execution flag :    false
     *     Include field names flag  :    false
     * </pre>
     * Every setting may be changed using set methods.
     *
     * @param {string} sql - SQL query string.
     *
     * @return {SqlFieldsQuery} - new SqlFieldsQuery instance.
     */
    constructor(sql: string) {
        super(null, sql);
        this._operation = OPERATION.QUERY_SQL_FIELDS;
        this._schema = null;
        this._maxRows = -1;
        this._statementType = STATEMENT_TYPE.ANY;
        this._enforceJoinOrder = false;
        this._collocated = false;
        this._lazy = false;
        this._includeFieldNames = false;
    }

    static get STATEMENT_TYPE() {
        return STATEMENT_TYPE;
    }

    /**
     * Set schema for the query.
     *
     * @param {string} schema - schema for the query.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setSchema(schema: string): SqlFieldsQuery {
        this._schema = schema;
        return this;
    }

    /**
     * Set max rows.
     *
     * @param {number} maxRows - max rows.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setMaxRows(maxRows: number): SqlFieldsQuery {
        this._maxRows = maxRows;
        return this;
    }

    /**
     * Set statement type.
     *
     * @param {STATEMENT_TYPE} type - statement type.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setStatementType(type: STATEMENT_TYPE): SqlFieldsQuery {
        this._statementType = type;
        return this;
    }

    /**
     * Set enforce join order flag.
     *
     * @param {boolean} enforceJoinOrder - enforce join order flag: true or false.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setEnforceJoinOrder(enforceJoinOrder: boolean): SqlFieldsQuery {
        this._enforceJoinOrder = enforceJoinOrder;
        return this;
    }

    /**
     * Set collocated flag.
     *
     * @param {boolean} collocated - collocated flag: true or false.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setCollocated(collocated: boolean): SqlFieldsQuery {
        this._collocated = collocated;
        return this;
    }

    /**
     * Set lazy query execution flag.
     *
     * @param {boolean} lazy - lazy query execution flag: true or false.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setLazy(lazy: boolean): SqlFieldsQuery {
        this._lazy = lazy;
        return this;
    }

    /**
     * Set include field names flag.
     *
     * @param {boolean} includeFieldNames - include field names flag: true or false.
     *
     * @return {SqlFieldsQuery} - the same instance of the SqlFieldsQuery.
     */
    setIncludeFieldNames(includeFieldNames: boolean): SqlFieldsQuery {
        this._includeFieldNames = includeFieldNames;
        return this;
    }

    /** Private methods */

    /**
     * @ignore
     */
    async _write(communicator, buffer) {
        BinaryCommunicator.writeString(buffer, this._schema);
        buffer.writeInteger(this._pageSize);
        buffer.writeInteger(this._maxRows);
        BinaryCommunicator.writeString(buffer, this._sql);
        await this._writeArgs(communicator, buffer)
        buffer.writeByte(this._statementType);
        buffer.writeBoolean(this._distributedJoins);
        buffer.writeBoolean(this._local);
        buffer.writeBoolean(this._replicatedOnly);
        buffer.writeBoolean(this._enforceJoinOrder);
        buffer.writeBoolean(this._collocated);
        buffer.writeBoolean(this._lazy);
        buffer.writeLong(this._timeout);
        buffer.writeBoolean(this._includeFieldNames);
    }

    /**
     * @ignore
     */
    // @ts-ignore
    async _getCursor(communicator, payload, keyType = null, valueType = null): Promise<BaseCursor<Array<object>>> {
        const cursor = new SqlFieldsCursor(communicator, payload);
        await cursor._readFieldNames(payload, this._includeFieldNames);
        return cursor;
    }
}

/**
 * Class representing a Scan query which returns the whole cache entries (key-value pairs).
 *
 * This version of the class does not support a possibility to specify a Filter object for the query.
 * The query returns all entries from the entire cache or from the specified partition.
 * @extends Query
 */
export class ScanQuery extends Query<CacheEntry> {

    private _partitionNumber: number;

    /**
     * Public constructor.
     *
     * Scan query settings have the following defaults:
     * <pre>
     *     Scan Query setting        :    Default value
     *     Local query flag          :    false
     *     Cursor page size          :    1024
     *     Partition number          :    -1 (entire cache)
     *     Filter object             :    null (not supported)
     * </pre>
     * Every setting (except Filter object) may be changed using set methods.
     *
     * @return {ScanQuery} - new ScanQuery instance.
     */
    constructor() {
        super(OPERATION.QUERY_SCAN);
        this._partitionNumber = -1;
    }

    /**
     * Sets a partition number over which this query should iterate.
     *
     * If negative, the query will iterate over all partitions in the cache.
     *
     * @param {number} partitionNumber - partition number over which this query should iterate.
     *
     * @return {ScanQuery} - the same instance of the ScanQuery.
     */
    setPartitionNumber(partitionNumber: number): ScanQuery {
        this._partitionNumber = partitionNumber;
        return this;
    }

    /** Private methods */

    /**
     * @ignore
     */
    async _write(communicator: BinaryCommunicator, buffer: MessageBuffer) {
        // filter
        await communicator.writeObject(buffer, null);
        buffer.writeInteger(this._pageSize);
        buffer.writeInteger(this._partitionNumber);
        buffer.writeBoolean(this._local);
    }

    /**
     * @ignore
     */
    async _getCursor(communicator: BinaryCommunicator, payload, keyType = null, valueType = null) {
        const cursor = new Cursor(communicator, OPERATION.QUERY_SCAN_CURSOR_GET_PAGE, payload, keyType, valueType);
        cursor._readId(payload);
        return cursor;
    }
}
