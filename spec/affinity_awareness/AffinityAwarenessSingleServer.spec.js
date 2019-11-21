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

const Util = require('util');
const config = require('../config');
const TestingHelper = require('../TestingHelper');
const IgniteClient = require('@gridgain/thin-client');
const Errors = IgniteClient.Errors;
const CacheConfiguration = IgniteClient.CacheConfiguration;
const CacheKeyConfiguration = IgniteClient.CacheKeyConfiguration;
const ObjectType = IgniteClient.ObjectType;
const BinaryObject = IgniteClient.BinaryObject;
const ComplexObjectType = IgniteClient.ComplexObjectType;

const CACHE_NAME = '__test_cache';

describe('affinity awareness with single server checks by logs test suite >', () => {
    let igniteClient = null;
    const affinityKeyField = 'affKeyField';

    beforeAll((done) => {
        Promise.resolve().
            then(async () => {
                const serverNum = 3;
                let endpoints = TestingHelper.getEndpoints(serverNum);
                await TestingHelper.init(true, serverNum, true, [endpoints[0]]);
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
            catch(error => done());
    }, TestingHelper.TIMEOUT);

    it('all cache operations with affinity aware client on single server', (done) => {
        Promise.resolve().
            then(async () => {
                const val = "someVal";
                const valType = ObjectType.PRIMITIVE_TYPE.STRING;

                for (let keyType of Object.keys(TestingHelper.primitiveValues)) {
                    keyType = parseInt(keyType);
                    if (keyType == ObjectType.PRIMITIVE_TYPE.DECIMAL) {
                        // Decimal is not a recommended type to use as a key
                        continue;
                    }
                    const typeInfo1 = TestingHelper.primitiveValues[keyType];
                    for (let value1 of typeInfo1.values) {
                        await putAndCheckLocalPeek(keyType, valType, value1, val);
                        if (typeInfo1.typeOptional) {
                            await putAndCheckLocalPeek(null, valType, value1, val);
                        }
                    }
                }
            }).
            then(done).
            catch(error => done.fail(error));
    });

    function createCacheConfig(keyCfg = null) {
        return new CacheConfiguration().
            setWriteSynchronizationMode(CacheConfiguration.WRITE_SYNCHRONIZATION_MODE.FULL_SYNC).
            setCacheMode(CacheConfiguration.CACHE_MODE.PARTITIONED).
            setKeyConfigurations(keyCfg);
    }

    async function testSuiteCleanup(done) {
        await TestingHelper.destroyCache(CACHE_NAME, done);
    }
});
