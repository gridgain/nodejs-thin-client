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
const ObjectType = IgniteClient.ObjectType;

const CACHE_NAME = '__test_cache';
const SERVER_NUM = 3;

describe('affinity awareness multiple connections failover test suite >', () => {
    let igniteClient = null;

    beforeEach((done) => {
        Promise.resolve().
            then(async () => {
                await TestingHelper.init(true, SERVER_NUM, true);
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

    it('cache operation fails gracefully when all nodes are killed', (done) => {
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
                const serverId = await TestingHelper.getRequestGridIdx();
                expect(serverId).not.toEqual(-1, 'Can not find node for a get request');

                TestingHelper.killNodeById(serverId);

                expect(await cache.get(key)).toEqual(key);
            }).
            then(done).
            catch(error => done.fail(error));
    });

    async function getCache(keyType, valueType, cacheName = CACHE_NAME, cacheCfg = null) {
        return (await igniteClient.getOrCreateCache(cacheName, cacheCfg)).
            setKeyType(keyType).
            setValueType(valueType);
    }
});
