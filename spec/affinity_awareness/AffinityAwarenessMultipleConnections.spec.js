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
const AffinityAwarenessTestUtils = require('./AffinityAwarenessTestUtils');
const IgniteClient = require('@gridgain/thin-client');
const ObjectType = IgniteClient.ObjectType;

const CACHE_NAME = '__test_cache';
const CUSTOM_AFFINITY_CACHE = 'custom-affinity';
const SERVER_NUM = 3;

describe('affinity awareness multiple connections test suite >', () => {
    let igniteClient = null;

    beforeAll((done) => {
        Promise.resolve().
            then(async () => {
                await TestingHelper.init(true, SERVER_NUM, true);
                igniteClient = TestingHelper.igniteClient;
                await testSuiteCleanup(done);
            }).
            then(done).
            catch(error => done.fail(error));
    }, TestingHelper.TIMEOUT);

    afterAll((done) => {
        Promise.resolve().
            then(async () => {
                await testSuiteCleanup(done);
                await TestingHelper.cleanUp();
            }).
            then(done).
            catch(_error => done());
    }, TestingHelper.TIMEOUT);

    it('all cache operations with affinity awareness and multiple connections', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getOrCreateCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
                await AffinityAwarenessTestUtils.testAllCacheOperations(cache);
            }).
            then(done).
            catch(error => done.fail(error));
    });

    it('all cache operations with affinity awareness and bad affinity', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getOrCreateCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER, CUSTOM_AFFINITY_CACHE);
                await AffinityAwarenessTestUtils.testAllCacheOperations(cache);
            }).
            then(done).
            catch(error => done.fail(error));
    });
    
    it('put with affinity awareness and unknown cache', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
                let key = 42;
                try {
                    await cache.put(key, key);
                }
                catch (error) {
                    expect(error.toString()).toContain('Cache does not exist');
                    return;
                }
                fail('Exception was expected');
            }).
            then(done).
            catch(error => done.fail(error));
    });

    it('get or create null cache with affinity awareness', (done) => {
        Promise.resolve().
            then(async () => {
                try {
                    await getOrCreateCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER, null);
                }
                catch (error) {
                    expect(error.toString()).toContain('"name" argument should not be empty');
                    return;
                }
                fail('Exception was expected');
            }).
            then(done).
            catch(error => done.fail(error));
    });

    async function getOrCreateCache(keyType, valueType, cacheName = CACHE_NAME, cacheCfg = null) {
        return (await igniteClient.getOrCreateCache(cacheName, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }

    async function getCache(keyType, valueType, cacheName = CACHE_NAME, cacheCfg = null) {
        return (await igniteClient.getCache(cacheName, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }
    
    async function testSuiteCleanup(done) {
        await TestingHelper.destroyCache(CACHE_NAME, done);
        await TestingHelper.destroyCache(CUSTOM_AFFINITY_CACHE, done);
    }
});
