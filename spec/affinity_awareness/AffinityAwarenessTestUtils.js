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

const TestingHelper = require('../TestingHelper');
const IgniteClient = require('@gridgain/thin-client');
const CacheConfiguration = IgniteClient.CacheConfiguration;

// Helper class for testing affinity awareness feature of @gridgain/thin-client library.
class AffinityAwarenessTestUtils {
    static createCacheConfig() {
        return new CacheConfiguration().
            setWriteSynchronizationMode(CacheConfiguration.WRITE_SYNCHRONIZATION_MODE.FULL_SYNC).
            setCacheMode(CacheConfiguration.CACHE_MODE.PARTITIONED);
    }

    static async getOrCreateCache(igniteClient, keyType, valueType, cacheName = CACHE_NAME, cacheCfg = null) {
        if (!cacheCfg)
            cacheCfg = AffinityAwarenessTestUtils.createCacheConfig();

        return (await igniteClient.getOrCreateCache(cacheName, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }

    static async testAllCacheOperations(cache) {
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

    static async expectOnTheNode(expectedNodeId, req) {
        const actualNodeId = await TestingHelper.getRequestGridIdx(req);
        expect(actualNodeId).toEqual(expectedNodeId);
    }

    static async testAllCacheOperationsOnTheSameKey(cache, key) {
        const value1 = 42;
        const value2 = 100500;

        // Put/Get
        await cache.put(key, value1);
        const expectedNodeId = await TestingHelper.getRequestGridIdx('Put');

        expect(await cache.get(key)).toEqual(value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // Replace
        let res = await cache.replace(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Replace');
        
        expect(res).toBe(true);
        expect(await cache.get(key)).toEqual(value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // Clear
        await cache.clearKey(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ClearKey');
        expect(await cache.get(key)).toBeNull;
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // ContainsKey
        res = await cache.containsKey(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ContainsKey');
        expect(res).toBe(false);

        // GetAndPut
        await cache.put(key, value1);
        await TestingHelper.getRequestGridIdx('Put');

        res = await cache.getAndPut(key, value2);
        await TestingHelper.getRequestGridIdx('GetAndPut');

        expect(res).toEqual(value1);
        expect(await cache.get(key)).toEqual(value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // GetAndPutIfAbsent
        await cache.clearKey(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ClearKey');

        res = await cache.getAndPutIfAbsent(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'GetAndPutIfAbsent');

        let res2 = await cache.getAndPutIfAbsent(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'GetAndPutIfAbsent');

        expect(res).toBeNull();
        expect(res2).toEqual(value1);
        expect(await cache.get(key)).toEqual(value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // PutIfAbsent
        await cache.clearKey(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ClearKey');

        res = await cache.putIfAbsent(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'PutIfAbsent');

        res2 = await cache.putIfAbsent(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'PutIfAbsent');

        expect(res).toBe(true);
        expect(res2).toBe(false);
        expect(await cache.get(key)).toEqual(value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');

        // GetAndRemove
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        res = await cache.getAndRemove(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'GetAndRemove');
        
        expect(res).toEqual(value1);
        expect(await cache.get(key)).toBeNull();
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    
        // GetAndReplace
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        res = await cache.getAndReplace(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'GetAndReplace');

        expect(res).toEqual(value1);
        expect(await cache.get(key)).toEqual(value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    
        // RemoveKey
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        await cache.removeKey(key);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'RemoveKey');

        expect(await cache.get(key)).toBeNull();
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    
        // RemoveIfEquals
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        res = await cache.removeIfEquals(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'RemoveIfEquals');

        res2 = await cache.removeIfEquals(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'RemoveIfEquals');

        expect(res).toBe(false);
        expect(res2).toBe(true);
        expect(await cache.get(key)).toBeNull();
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    
        // Replace
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        await cache.replace(key, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Replace');

        expect(await cache.get(key)).toEqual(value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    
        // ReplaceIfEquals
        await cache.put(key, value1);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Put');

        res = await cache.replaceIfEquals(key, value2, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ReplaceIfEquals');

        res2 = await cache.replaceIfEquals(key, value1, value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'ReplaceIfEquals');

        expect(res).toBe(false);
        expect(res2).toBe(true);
        expect(await cache.get(key)).toEqual(value2);
        await AffinityAwarenessTestUtils.expectOnTheNode(expectedNodeId, 'Get');
    }
}

module.exports = AffinityAwarenessTestUtils;
