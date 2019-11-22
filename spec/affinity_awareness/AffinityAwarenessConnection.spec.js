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
const IgniteClientConfiguration = IgniteClient.IgniteClientConfiguration;
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
    const serverNum = 3;

    beforeAll((done) => {
        Promise.resolve().
            then(async () => {
                await TestingHelper.initClusterOnly(serverNum, false);
            }).
            then(done).
            catch(error => done.fail(error));
    }, TestingHelper.TIMEOUT);

    afterAll((done) => {
        Promise.resolve().
            then(async () => {
                await TestingHelper.cleanUp();
            }).
            then(done).
            catch(_error => done());
    }, TestingHelper.TIMEOUT);

    it('client with affinity awareness and bad servers', (done) => {
        Promise.resolve().
            then(async () => {
                const badEndpoints = ['127.0.0.1:10900', '127.0.0.1:10901'];
                const realEndpoints = TestingHelper.getEndpoints(serverNum);

                for (const ep of realEndpoints)
                    expect(badEndpoints).not.toContain(ep);

                const client = TestingHelper.makeClient();
                const cfg = new IgniteClientConfiguration(...badEndpoints).setConnectionOptions(false, null, true);

                try {
                    await client.connect(cfg);
                }
                catch (error) {
                    expect(error.stack).toContain('Connection failed');

                    return;
                }

                throw 'Connection should be rejected';
            }).
            then(done).
            catch(error => done.fail(error));
    });

});
