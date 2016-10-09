/* eslint-disable no-unused-expressions */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { expect } from 'chai';
import { spy } from 'sinon';
import * as actions from '../../app/actions/account';

const version = 17;
const email = 'test@test.com';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('async actions', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('routes to /players when login was success', () => {
    // Mock Login Responses from Fut
    const scope = nock('https://www.easports.com/');
    scope.get('/fifa/ultimate-team/web-app').reply(200, `
      <html>
        <head>
          <title>FIFA Football | FUT Web App | EA SPORTS</title>
        </head>
        <body></body>
      </html>
    `);
    scope.get(`/iframe/fut${version}/`).query(true).reply(200, `
      <html>
        <head>
          <title>Fifa Ultimate Team</title>
          <script type="text/javascript">
            var HOST_DOMAIN = 'http://www.easports.com/';
            var EASW_ID = '1234567890';
          </script>
        </head>
        <body></body>
      </html>
    `);
    scope.get(`/iframe/fut${version}/p/ut/shards/v2`).query(true).reply(200, {
      shardInfo: [
        {
          shardId: 'shard1',
          clientFacingIpPort: 'utas.external.fut.ea.com:443',
          clientProtocol: 'https',
          platforms: [
            'xbox',
            'ios',
            'and',
            '360'
          ],
          customdata1: [
            'card-360',
            'card-ios',
            'card-and'
          ],
          skus: [
            '392A0001',
            'FFA14XBX',
            'FFA14CAP',
            '398A0001',
            'FFA14IOS',
            'FFA14AND',
            'FFA14MPC',
            'FFA14AZN',
            'FFA15XBX',
            'FFA15XBO',
            'FFA15IOS',
            'FFA15AND',
            'FFA15MPC',
            'FFA15AZN'
          ]
        },
        {
          shardId: 'shard2',
          clientFacingIpPort: 'utas.external.s2.fut.ea.com:443',
          clientProtocol: 'https',
          platforms: [
            'pc',
            'ps3'
          ],
          customdata1: [
            'card-pc',
            'card-ps3'
          ],
          skus: [
            '395A0001',
            'FFA14PCC',
            '391A0001',
            'FFA14PS3',
            'FFA14KTL',
            'FFA15PS3',
            'FFA15PS4',
            'FFA15PCC',
            'FFA16PS3',
            'FFA16PS4',
            'FFA16PCC',
            'FFA17PS4',
            'FFA17PCC',
            'FFA17PS3'
          ]
        },
        {
          shardId: 'shard3',
          clientFacingIpPort: 'utas.external.s3.fut.ea.com:443',
          clientProtocol: 'https',
          platforms: [
            'xbox',
            '360'
          ],
          customdata1: [
            'card-360'
          ],
          skus: [
            'FFA16XBX',
            'FFA16XBO',
            'FFA17XBO',
            'FFA17XBX'
          ]
        }
      ]
    });
    scope.get(`/iframe/fut${version}/p/ut/game/fifa${version}/user/accountinfo`).query(true).reply(200, {
      userAccountInfo: {
        personas: [
          {
            personaId: 123456789,
            personaName: 'Tester',
            returningUser: 0,
            trial: false,
            userState: null,
            userClubList: [
              {
                year: '2017',
                assetId: 123456,
                teamId: 123456,
                lastAccessTime: 1475974832,
                platform: '360',
                clubName: 'Test',
                clubAbbr: 'Tst',
                established: 1475347740,
                divisionOnline: 1,
                badgeId: 1234567,
                skuAccessList: {
                  FFA17XBO: 1475974832
                }
              }
            ]
          }
        ]
      }
    });
    scope.post(`/iframe/fut${version}/p/ut/auth`).reply(200, {
      protocol: 'https',
      ipPort: 'utas.external.s3.fut.ea.com:443',
      serverTime: '2016-10-09T02:04:44+0000',
      lastOnlineTime: '2016-10-09T02:04:44+0000',
      sid: '94365293-1203-4a49-87d8-3398de0f0355'
    });
    scope.get(`/iframe/fut${version}/p/ut/game/fifa${version}/phishing/question`).query(true).reply(200, {
      debug: 'Already answered question.',
      string: 'Already answered question',
      code: '483',
      reason: 'Already answered question.',
      token: '2833763939926856274'
    });

    const account = { email, password: 'test', secret: 'test', platform: 'xone' };
    const store = mockStore({ account });

    return store.dispatch(actions.login(account))
      .then(() => { // return of async actions
        expect(store.getActions()).to.include({
          type: '@@router/CALL_HISTORY_METHOD',
          payload: { method: 'push', args: ['/players'] }
        });
      });
  });

  it('dispatches SET_CREDITS when getCoins is completed', () => {
    // Mock credits response
    const credits = 1000;
    nock('https://utas.external.s3.fut.ea.com')
      .post(`/ut/game/fifa${version}/user/credits`)
      .reply(200, { credits });

    const store = mockStore({});

    return store.dispatch(actions.getCredits(email))
      .then(() => { // return of async actions
        expect(store.getActions()).to.include(actions.setCredits(credits));
      });
  });
});

describe('actions', () => {
  it('setAccountInfo should create SET_ACCOUNT_INFO action', () => {
    const key = 'email';
    const value = 'test@test.com';
    expect(actions.setAccountInfo(key, value)).to.deep.equal(
      { type: actions.SET_ACCOUNT_INFO, key, value }
    );
  });

  it('setCredits should create SET_CREDITS action', () => {
    const credits = 1000;
    expect(actions.setCredits(credits)).to.deep.equal(
      { type: actions.SET_CREDITS, credits }
    );
  });
});
