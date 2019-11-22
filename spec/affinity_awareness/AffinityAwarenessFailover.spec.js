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

describe('affinity awareness failover test suite >', () => {
    let igniteClient = null;
    const affinityKeyField = 'affKeyField';

    beforeEach((done) => {
        Promise.resolve().
            then(async () => {
                const serverNum = 3;
                await TestingHelper.init(true, serverNum, true);
                igniteClient = TestingHelper.igniteClient;
            }).
            then(done).
            catch(error => done.fail(error));
    }, TestingHelper.TIMEOUT);

    afterEach((done) => {
        Promise.resolve().
            then(async () => {
                await TestingHelper.cleanUp();
            }).
            then(done).
            catch(_error => done());
    }, TestingHelper.TIMEOUT);

    it('cache operation fails gracefully when all nodes is killed', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
                let key = 1;

                // Put/Get
                await cache.put(key, key);
                expect(await cache.get(key)).toEqual(key);

                // Killing nodes
                TestingHelper.stopTestServers();

                // Get
                try {
                    await cache.put(key, key);
                }
                catch (error) {
                    expect(error.stack).toContain('Cluster is unavailable');

                    return;
                }

                throw 'Operation fail is expected';
            }).
            then(done).
            catch(error => done.fail(error));
    });

    it('cache operation does not fail when single node is killed', (done) => {
        Promise.resolve().
            then(async () => {
                const cache = await getCache(ObjectType.PRIMITIVE_TYPE.INTEGER, ObjectType.PRIMITIVE_TYPE.INTEGER);
                let key = 1;

                // Put to inialize partition mapping
                await cache.put(key, key);
                await TestingHelper.waitMapObtained(igniteClient, cache);

                // Get to find out the right node
                expect(await cache.get(key)).toEqual(key);

                // Killing node for the key
                const serverId = findServerByLogs(serverNum);
                TestingHelper.killNodeById(serverId);

                expect(await cache.get(key)).toEqual(key);
            }).
            then(done).
            catch(error => done.fail(error));
    });

    async function getCache(keyType, valueType, cacheCfg = null) {
        return (await igniteClient.getOrCreateCache(CACHE_NAME, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }
});
