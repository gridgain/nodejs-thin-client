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

const CACHE_NAME = '__test_cache';

describe('affinity awareness with single server test suite >', () => {
    beforeAll((done) => {
        Promise.resolve().
            then(async () => {
                const serverNum = 3;
                let endpoints = TestingHelper.getEndpoints(serverNum);
                await TestingHelper.init(true, serverNum, false, [endpoints[0]]);
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

    it('all cache operations with affinity aware client and single connection', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
                await AffinityAwarenessTestUtils.testAllCacheOperations(cache);
            }).
            then(done).
            catch(error => done.fail(error));
    });

    async function getCache(keyType, valueType, cacheName = CACHE_NAME, cacheCfg = null) {
        return (await igniteClient.getOrCreateCache(cacheName, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }

    async function testSuiteCleanup(done) {
        await TestingHelper.destroyCache(CACHE_NAME, done);
    }
});
