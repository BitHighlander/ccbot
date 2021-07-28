/**
 * Created by highlander on 12/16/16.
 */

const proxyquire = require('proxyquire')
const rewire = require('rewire')
const moment = require('moment')
//const uuid = require('node-uuid');

//global
let debug = false

describe.skip('Accounting Module', function ()
{

    let matchEngine

    before(async function ()
    {
        //matchEngine = require('./../../modules/match.js')

        accounting = rewire('../../modules/accounting.js')
        //rewire redis
        //accounting.__set__('redis', redis)

        //turn on debug
        accounting.__set__('debug', true)

        //but dont really log anything
        let  fakeConsole = {}
        fakeConsole.error = function(err){}
        fakeConsole.log = function(err){}
        accounting.__set__('console', fakeConsole)

        //rewire pubsub
        //arbiter.__set__('publisher', {publish: sinon.spy()})

    })

    afterEach(async function ()
    {
        await(redis.flushdb())
    })

    //
    describe('Should Handle Accuracy Correctly', function ()
    {
        it('Should not cut off any decimals', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,1.23456789,"btc"))
            expect(balance).to.be.equal(123456789)
        })

        it('Should not allow a 0 credit', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.credit(orderId,0,"eth"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })

        it('Should throw if empty account', function ()
        {
            var orderId = ""
            return expect(accounting.credit(orderId,0,"eth"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })

        it('Should throw if empty coin', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.credit(orderId,0,""))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })

        it('Should throw if unknown coin', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.credit(orderId,0,"XMR"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })

        it('Should not allow a 0 debit', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.debit(orderId,0,"btc"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:300 failed to debit!")
        })


        it('Should not allow a negative credit', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.credit(orderId,-1,"eth"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })


        it('Should not allow a negitive debit', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.debit(orderId,-1,"btc"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:300 failed to debit!")
        })

    })

    describe('Should Handle Precision Correctly', function ()
    {

        it('Should be able to credit a single satoshi', async function ()
        {
            let orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,1,"BTC"))
            expect(balance).to.be.equal(100000000)
            let balance2 = await(accounting.credit(orderId,0.00000001,"BTC"))
            expect(balance2).to.be.equal(100000001)

            let balance3 = await(accounting.balance(orderId,"BTC"))
            expect(balance3).to.be.equal(1.00000001)
        })

        it('Should be able to debit a single satoshi', async function ()
        {
            let orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,1,"BTC"))
            expect(balance).to.be.equal(100000000)
            let balance2 = await(accounting.debit(orderId,0.00000001,"BTC"))
            expect(balance2).to.be.equal(99999999)

            // let balance3 = await(accounting.balance(orderId,"BTC"))
            // expect(balance3).to.be.equal(99999999)
        })

        it.skip('Should error on too many decimals', function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.credit(orderId,1.000000001,"eth"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:200 failed to credit!")
        })


    })

    describe('Should Not Allow Overdrafts', function ()
    {
        it('Should throw on overdraft', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,1,"BTC"))
            expect(balance).to.be.equal(100000000)

            return expect(accounting.debit(orderId,1.00000001,"BTC"))
                .to.eventually.be.rejectedWith("ERROR:CREDIT:300 failed to debit!")

        })

        it('Should allow a 0 balance', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,1,"BTC"))
            expect(balance).to.be.equal(100000000)

            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance2 = await(accounting.debit(orderId,1,"BTC"))
            expect(balance2).to.be.equal(0)
        })
    })

    describe('Should Be flexible with input types', function ()
    {
        it('Should not error on string Credit', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,"1","BTC"))
            expect(balance).to.be.equal(100000000)
        })

        it('Should not error on string Debit', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.credit(orderId,"1","BTC"))
            expect(balance).to.be.equal(100000000)

            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance2 = await(accounting.debit(orderId,"1","BTC"))
            expect(balance2).to.be.equal(0)
        })

    })

    describe('Should Display balances correctly', function ()
    {
        it('Should throw on empty account', async function ()
        {
            var orderId = ""
            return expect(accounting.balance(orderId,"BTC"))
                .to.eventually.be.rejectedWith("ERROR:BALANCE:100 failed to find balance")

        })

        it('Should throw on unknown account', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            let balance = await(accounting.balance(orderId,"BTC"))
            expect(balance).to.be.equal(0)
        })

        it('Should throw on unknown coin', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.balance(orderId,"XMR"))
                .to.eventually.be.rejectedWith("ERROR:BALANCE:100 failed to find balance")
        })

        it('Should throw on empty coin', async function ()
        {
            var orderId = "520ff060-0ed3-4f4f-9738-23b39625062f"
            return expect(accounting.balance(orderId,""))
                .to.eventually.be.rejectedWith("ERROR:BALANCE:100 failed to find balance")
        })
    })

    describe('Should Digest Match Objects accurately', function ()
    {
        it('Bitcoin perfect match', async function ()
        {
            let idNew1 = uuid.v4()
            await(accounting.credit(idNew1,1,"BTC"))
            let idNew2 = uuid.v4()
            await(accounting.credit(idNew2,1,"ETH"))

            if(debug) console.log(idNew1,"BTC: ",1)
            if(debug) console.log(idNew2,"ETH: ",1)

            let order1Bal = await redis.hget(idNew1,"BTC")
            if(debug) console.log("order1Bal: ",order1Bal)
            expect(order1Bal).to.be.equal('100000000')


            let order2Bal = await redis.hget(idNew2,"ETH")
            if(debug) console.log("order2Bal: ",order2Bal)
            expect(order2Bal).to.be.equal('100000000')

            //match object
            let match = {
                engine: 'ETH_BTC',
                restingOrder:
                { id: idNew1,
                    taker: false,
                    price: 1,
                    quantity: 0,
                    status: 'complete',
                    isBuy: true },
                aggressiveOrder:
                { id: idNew2,
                    taker: true,
                    price: 1,
                    quantity: 0,
                    status: 'complete',
                    isBuy: false },
                restingOrderPrice: 1,
                matchQuantity: 1,
                time: 1486095432143
            }
            try{
                let report = await(accounting.match(match))
                if(debug) console.log(report)

                expect(report.balanceResting.id).to.be.equal(idNew1)
                expect(report.balanceAggresive.id).to.be.equal(idNew2)

                //full trade
                //console.log("bal: ",report.balanceResting)
                expect(report.balanceResting.ETH).to.be.equal(100000000)
                expect(report.balanceResting.BTC).to.be.equal(0)

                expect(report.balanceAggresive.ETH).to.be.equal(0)
                expect(report.balanceAggresive.BTC).to.be.equal(100000000)

                let order1BalFinal = await redis.hget(idNew1,"ETH")
                if(debug) console.log("order1Bal: ",order1BalFinal)
                expect(order1BalFinal).to.be.equal('100000000')


                let order2BalFinal = await redis.hget(idNew2,"BTC")
                if(debug) console.log("order2Bal: ",order2BalFinal)
                expect(order2BalFinal).to.be.equal('100000000')

            }catch(e){
                console.error(e)
            }

        })


        it('Bitcoin Aggressive partial fill', async function ()
        {
            let idNew1 = uuid.v4()
            await(accounting.credit(idNew1,3,"ETH"))
            let idNew2 = uuid.v4()
            await(accounting.credit(idNew2,0.06737529,"BTC"))

            if(debug) console.log(idNew1,"ETH: ",3)
            if(debug) console.log(idNew2,"BTC: ",1)

            //let sellId = engine.submitOrder({id:uuid.v4(),quantity: -3, price: 0.06737529});
            //let buyId1 = engine.submitOrder({id:uuid.v4(),quantity: 1, price: 0.06737529});

            //match object
            let match =
                { engine: 'ETH_BTC',
                    time: 1524167982393,
                    restingOrder:
                        { id: idNew1,
                            price: 0.06737529,
                            quantity: 2,
                            status: 'Working',
                            isBuy: false },
                    aggressiveOrder:
                        { id: idNew2,
                            price: 0.06737529,
                            quantity: 0,
                            status: 'complete',
                            isBuy: true },
                    restingOrderPrice: 0.06737529,
                    matchQuantity: 1 }
            try{
                let report = await(accounting.match(match))
                if(debug)console.log("report",report)

                expect(report.balanceResting.id).to.be.equal(idNew1)
                expect(report.balanceAggresive.id).to.be.equal(idNew2)

                //full trade
                //console.log("bal: ",report.balanceResting)
                expect(report.balanceResting.ETH).to.be.equal(200000000)
                expect(report.balanceResting.BTC).to.be.equal(6737529)

                expect(report.balanceAggresive.ETH).to.be.equal(100000000)
                expect(report.balanceAggresive.BTC).to.be.equal(0)
                //


            }catch(e){
                console.error(e)
            }

        })


        // it('Litecoin Aggressive partial fill', async function ()
        // {
        //     let idNew1 = uuid.v4()
        //     await(accounting.credit(idNew1,7.5,"BTC"))
        //     let idNew2 = uuid.v4()
        //     await(accounting.credit(idNew2,3,"ETH"))
        //
        //     console.log(idNew1,"BTC: ",7.5)
        //     console.log(idNew2,"ETH: ",3)
        //
        //     //match object
        //     let match = {
        //         engine: 'BTC-ETH',
        //         restingOrder:
        //         { id: 'c6a04701-d4ed-4817-b257-4d015ea3ea5a',
        //             taker: false,
        //             price: 0.00336,
        //             quantity: 0,
        //             status: 'complete',
        //             isBuy: true,
        //             event: 'order' },
        //         aggressiveOrder:
        //         { id: '2c660df0-88ba-4576-9f48-29dbaf39fbbe',
        //             taker: true,
        //             price: 0.00336,
        //             quantity: 0.09968,
        //             status: 'Working',
        //             isBuy: false },
        //         restingOrderPrice: 0.00336,
        //         matchQuantity: 0.00032,
        //         time: 1489031390798
        //     }
        //     try{
        //         let report = await(accounting.match(match))
        //         console.log("report",report)
        //
        //         expect(report.balanceResting.id).to.be.equal(idNew1)
        //         expect(report.balanceAggresive.id).to.be.equal(idNew2)
        //
        //         //full trade
        //         //console.log("bal: ",report.balanceResting)
        //         // expect(report.balanceResting.ETH).to.be.equal(100000000)
        //         // expect(report.balanceResting.BTC).to.be.equal(0)
        //         //
        //         // expect(report.balanceAggresive.ETH).to.be.equal(0)
        //         // expect(report.balanceAggresive.BTC).to.be.equal(100000000)
        //         //
        //
        //
        //     }catch(e){
        //         console.error(e)
        //     }
        //
        // }))
    })

})
