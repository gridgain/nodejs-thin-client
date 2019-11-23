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

require('jasmine-expect');

const IgniteClient = require('@gridgain/thin-client');
const ObjectType = IgniteClient.ObjectType;

// Helper class for testing affinity awareness feature of @gridgain/thin-client library.
class AffinityAwarenessTestUtils {
    async testAllCacheOperations(igniteClient) {
        const cache = await getCache(igniteClient, ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
        let key = 1;
        let key2 = 2;

        // Put/Get
        await cache.put(key, key);
        expect(await cache.get(key)).toEqual(key);

        // Replace
        let res = await cache.replace(key, key2);
        expect(res).toBe(true);
        expect(await cache.get(key)).toEqual(key2);

        // ContainsKey
        res = await cache.containsKey(key2);
        expect(res).toBe(false);

        await cache.put(key2, key2);
        res = await cache.containsKey(key2);
        expect(res).toBe(true);

        // Clear
        await cache.clearKey(key2);
        expect(await cache.get(key2)).toBeNull;

        // GetAndPut
        await cache.put(key, key);
        res = await cache.getAndPut(key, key2);
        expect(res).toEqual(key);
        expect(await cache.get(key)).toEqual(key2);

        // GetAndPutIfAbsent
        await cache.clearKey(key);
        res = await cache.getAndPutIfAbsent(key, key);
        let res2 = await cache.getAndPutIfAbsent(key, key2);
        expect(res).toBeNull();
        expect(res2).toEqual(key);
        expect(await cache.get(key)).toEqual(key);

        // PutIfAbsent
        await cache.clearKey(key);
        res = await cache.putIfAbsent(key, key);
        res2 = await cache.putIfAbsent(key, key2);
        expect(res).toBe(true);
        expect(res2).toBe(false);
        expect(await cache.get(key)).toEqual(key);

        // GetAndRemove
        await cache.put(key, key);
        res = await cache.getAndRemove(key);
        expect(res).toEqual(key);
        expect(await cache.get(key)).toBeNull();
    
        // GetAndReplace
        await cache.put(key, key);
        res = await cache.getAndReplace(key, key2);
        expect(res).toEqual(key);
        expect(await cache.get(key)).toEqual(key2);
    
        // RemoveKey
        await cache.put(key, key);
        await cache.removeKey(key);
        expect(await cache.get(key)).toBeNull();
    
        // RemoveIfEquals
        await cache.put(key, key);
        res = await cache.removeIfEquals(key, key2);
        res2 = await cache.removeIfEquals(key, key);
        expect(res).toBe(false);
        expect(res2).toBe(true);
        expect(await cache.get(key)).toBeNull();
    
        // Replace
        await cache.put(key, key);
        await cache.replace(key, key2);
        expect(await cache.get(key)).toEqual(key2);
    
        // ReplaceIfEquals
        await cache.put(key, key);
        res = await cache.replaceIfEquals(key, key2, key2);
        res2 = await cache.replaceIfEquals(key, key, key2);
        expect(res).toBe(false);
        expect(res2).toBe(true);
        expect(await cache.get(key)).toEqual(key2);
    }
    
    async getCache(igniteClient, keyType, valueType, cacheCfg = null) {
        return (await igniteClient.getOrCreateCache(CACHE_NAME, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }
}

module.exports = AffinityAwarenessTestUtils;
