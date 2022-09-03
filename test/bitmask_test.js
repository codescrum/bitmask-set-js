'use strict'
import assert from 'assert'
import _ from 'lodash'
import JSBI from 'jsbi'
import { BitmaskSet, Bitmask } from '../index.js'

describe('Bitmask', function () {
  describe('#constructor', function () {
    it('throws an error if constructed without a set', function () {
      assert.throws(function () { new Bitmask() }, { name: 'Error', message: 'You need to specify a set for the bitmask to make sense.' })
      assert.throws(function () { new Bitmask(undefined) }, { name: 'Error', message: 'You need to specify a set for the bitmask to make sense.' })
      assert.throws(function () { new Bitmask(null) }, { name: 'Error', message: 'You need to specify a set for the bitmask to make sense.' })
    })

    it('throws an error if constructed with a set but no elements specified', function () {
      const bitmask_set = new BitmaskSet([1, 2, 3, 4])
    })

    describe('with a valid set but invalid arguments', function () {
      let test_set

      before(function (done) {
        test_set = new BitmaskSet([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        done()
      })

      it('throws an error if constructed undefined elements', function () {
        assert.throws(function () { new Bitmask(test_set, undefined) }, { name: 'Error', message: 'You must pass an array of elements or bits (BigInt) to create the bitmask.' })
      })

      it('throws an error if passed in with elements that do not belong to the set', function () {
        assert.throws(function () { new Bitmask(test_set, [999]) }, { name: 'Error', message: 'Element ' + 999 + ' not found in set.' })
      })

      it('throws an error if constructed with more bits than what the set size can manage', function () {
        assert.throws(function () { new Bitmask(test_set, JSBI.BigInt(1023 + 10)) }, { name: 'Error', message: "You are passing more bits than the set's size." })
      })

      it("throws an error if constructed with a string which is larger than the set's size", function () {
        assert.throws(function () { new Bitmask(test_set, '0101110111' + '1') }, { name: 'Error', message: "The string to build the bitmask from does not match the set's size (string is larger in length)." })
      })

      it("throws an error if constructed with a string which is smaller than the set's size", function () {
        assert.throws(function () { new Bitmask(test_set, '010111') }, { name: 'Error', message: "The string to build the bitmask from does not match the set's size (string is smaller in length)." })
      })

      it('throws an error if constructed with a string which is empty', function () {
        assert.throws(function () { new Bitmask(test_set, '') }, { name: 'Error', message: 'The string to build the bitmask from is empty!' })
      })

      it("throws an error if constructed with a string which contains characters other than 0's or 1's", function () {
        assert.throws(function () { new Bitmask(test_set, '0101A10B11') }, { name: 'Error', message: "The string to build the bitmask from must only contain 0's or 1's." })
      })
    })
  })

  describe('With valid sets', function () {
    let small_random_set
    let small_ordered_set

    before(function (done) {
      small_random_set = new BitmaskSet([0, 8, 1, 9, 3, 2, 4, 6, 7, 5])
      small_ordered_set = new BitmaskSet([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      done()
    })

    it('created when a valid string is passed', function () {
      const bitmask = small_ordered_set.bitmask('0101101001')
      assert.equal(bitmask.toString(), '0101101001')
      assert(JSBI.equal(bitmask.bits, JSBI.BigInt(361)))
      assert.equal(bitmask._elements, undefined) // Elements not computed yet is ok

      // Now, compute the elements ("applies" the changes)
      bitmask.compute_elements()

      assert.deepEqual(bitmask.elements(), [1, 3, 4, 6, 9])
    })

    //////////////////////////////////////////////////////////////////////////////
    // Querying
    //////////////////////////////////////////////////////////////////////////////
    describe('Querying', function () {
      it('#is_indexOf', function () {
        const random_bitmask = small_random_set.bitmask(_.shuffle([9, 2, 4, 6, 5])) // Test shuffling it
        const ordered_bitmask = small_ordered_set.bitmask(_.shuffle([9, 2, 4, 6, 5])) // Test shuffling it

        // String should follow the set order
        assert.equal(random_bitmask.indexOf(8), 1)
        assert.equal(random_bitmask.indexOf(5), 9)

        assert.equal(ordered_bitmask.indexOf(3), 3)
        assert.equal(ordered_bitmask.indexOf(6), 6)
      })
    })

    //////////////////////////////////////////////////////////////////////////////
    // Representations
    //////////////////////////////////////////////////////////////////////////////
    describe('Representations', function () {
      it('creates the bitmask string based on the set and elements', function () {
        const bitmask = small_random_set.bitmask(_.shuffle([9, 2, 4, 6, 5])) // Test shuffling it

        // String should follow the set order
        assert.equal(bitmask.toString(), '0001011101')
        assert(JSBI.equal(bitmask.toBigInt(), JSBI.BigInt(93)))
        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(93)))
      })

      it('creates the bitmask string based on the set and elements (sorted)', function () {
        const bitmask = small_ordered_set.bitmask(_.shuffle([1, 2, 3, 4, 5])) // Test shuffling it

        // String should follow the set order
        assert.equal(bitmask.toString(), '0111110000')
        assert(JSBI.equal(bitmask.toBigInt(), JSBI.BigInt(496)))
        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(496)))
      })

      it('creates the bitmask representations when constructed from bits/bigint, elements not present, until computed', function () {
        const bitmask = small_ordered_set.bitmask(JSBI.BigInt(496)) // Test shuffling it

        // String should follow the set order
        assert.equal(bitmask.toString(), '0111110000')
        assert(JSBI.equal(bitmask.toBigInt(), JSBI.BigInt(496)))
        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(496)))
        assert.equal(bitmask._elements, undefined)

        // Now, compute the elements
        bitmask.compute_elements()

        assert.deepEqual(bitmask.elements(), [1, 2, 3, 4, 5])
      })
    })

    //////////////////////////////////////////////////////////////////////////////
    // Operations
    //////////////////////////////////////////////////////////////////////////////
    describe('Operations', function () {
      it('#and - operates with `and`', function () {
        const bitmask_a = small_ordered_set.bitmask([2, 4, 5, 6, 9])
        const bitmask_b = small_ordered_set.bitmask([1, 2, 3, 4, 5])

        const bitmask = bitmask_a.and(bitmask_b)

        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(176)))
        assert.equal(bitmask.toString(), '0010110000')
      })

      it('#or - operates with `or`', function () {
        const bitmask_a = small_ordered_set.bitmask([2, 4, 5, 6, 9])
        const bitmask_b = small_ordered_set.bitmask([1, 2, 3, 4, 5])

        const bitmask = bitmask_a.or(bitmask_b)

        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(505)))
        assert.equal(bitmask.toString(), '0111111001')
      })

      it('#xor - operates with `xor`', function () {
        const bitmask_a = small_ordered_set.bitmask([2, 4, 5, 6, 9])
        const bitmask_b = small_ordered_set.bitmask([1, 2, 3, 4, 5])

        const bitmask = bitmask_a.xor(bitmask_b)
        
        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(329)))
        assert.equal(bitmask.toString(), '0101001001')
      })

      it("#is_invert - inverts the bitmask (flips 1's and 0's)", function () {
        const normal_bitmask = small_ordered_set.bitmask([2, 4, 5, 6, 9])
        const bitmask = normal_bitmask.invert()

        assert.equal(normal_bitmask.toString(), '0010111001')
        assert.equal(bitmask.toString(), '1101000110')
        assert(JSBI.equal(bitmask.bits, JSBI.BigInt(838)))
      })

      it('#is_in - checks for inclusion of a bitmask inside another', function () {
        const bitmask = small_ordered_set.bitmask('0101000101')
        const included_bitmask = small_ordered_set.bitmask('0101000100')
        const non_included_bitmask = small_ordered_set.bitmask('1101000000')

        assert(included_bitmask.is_in(bitmask))
        assert(!non_included_bitmask.is_in(bitmask))
        // assert.equal(normal_bitmask.toString(),   "0010111001")
        // assert.equal(bitmask.toString(), "1101000110")
        // assert(JSBI.equal(bitmask.bits, JSBI.BigInt(838)))
      })

      it("#is_in - checks for inclusion of a bitmask inside another (edge case - all 1's)", function () {
        const all = small_ordered_set.bitmask('1111111111')
        const some = small_ordered_set.bitmask('0101010101')
        const none = small_ordered_set.bitmask('0000000000')

        assert(all.is_in(all)) // Everything IS included in everything
        assert(some.is_in(all))
        assert(none.is_in(all))
      })

      it("#is_in - checks for inclusion of a bitmask inside another (edge case - all 0's)", function () {
        const all = small_ordered_set.bitmask('1111111111')
        const some = small_ordered_set.bitmask('0101010101')
        const none = small_ordered_set.bitmask('0000000000')

        assert(!all.is_in(none))
        assert(!some.is_in(none))
        assert(none.is_in(none)) // Nothing IS included in nothing
      })

      it('#is_not_in - checks for the non-inclusion of a bitmask inside another', function () {
        const bitmask = small_ordered_set.bitmask('1111100000')
        const included_bitmask = small_ordered_set.bitmask('0101100000')
        const non_included_bitmask = small_ordered_set.bitmask('0000011111')

        assert(non_included_bitmask.is_not_in(bitmask))
        assert(!included_bitmask.is_not_in(bitmask))
      })

      it("#is_not_in - checks for the non-inclusion of a bitmask inside another (edge case - all 1's)", function () {
        const all = small_ordered_set.bitmask('1111111111')
        const some = small_ordered_set.bitmask('0101010101')
        const none = small_ordered_set.bitmask('0000000000')

        assert(!some.is_not_in(all))
        assert(!none.is_not_in(all))
      })

      it("#is_not_in - checks for the non-inclusion of a bitmask inside another (edge case - all 0's)", function () {
        const all = small_ordered_set.bitmask('1111111111')
        const some = small_ordered_set.bitmask('0101010101')
        const none = small_ordered_set.bitmask('0000000000')

        assert(all.is_not_in(none))
        assert(some.is_not_in(none))
        assert(!none.is_not_in(none)) // The empty set is contained in itself (serves as "0 equality").
      })

      it('#add - adds elements if argument is an array of elements', function () {
        const bitmask = small_ordered_set.bitmask('0011000100')
        const result = bitmask.add([0, 2, 9])

        // Operate in bitmasks domain
        assert.equal(result.toString(), '1011000101')
        assert.equal(result._elements, undefined)

        // When we are done with that, we finally compute the elements
        result.compute_elements()
        assert.deepEqual(result.elements(), [0, 2, 3, 7, 9])
      })

      it('#add - adds elements if argument is another bitmask', function () {
        const bitmask   = small_ordered_set.bitmask('0011000100')
        const bitmask_a = small_ordered_set.bitmask('1010000101')
        const result = bitmask.add(bitmask_a)
        
        // Operate in bitmasks domain
        assert.equal(result.toString(), '1011000101')
        assert.equal(result._elements, undefined)
        
        // When we are done with that, we finally compute the elements
        result.compute_elements()

        assert.deepEqual(result.elements(), [0, 2, 3, 7, 9])
      })

      it('#remove - removes elements if argument is an array of elements', function () {
        const bitmask = small_ordered_set.bitmask('1011000101')
        const result = bitmask.remove([0, 2, 9])

        assert.equal(result.toString(), '0001000100')
        assert.equal(result._elements, undefined)

        // Now, compute the elements
        result.compute_elements()

        assert.deepEqual(result.elements(), [3, 7])
      })

      it('#remove - removes elements if argument is another bitmask', function () {
        const bitmask   = small_ordered_set.bitmask('0011000100')
        const bitmask_a = small_ordered_set.bitmask('1010000101')
        const result = bitmask.remove(bitmask_a)
        
        // Operate in bitmasks domain
        assert.equal(result.toString(), '0001000000')
        assert.equal(result._elements, undefined)
        
        // When we are done with that, we finally compute the elements
        result.compute_elements()

        assert.deepEqual(result.elements(), [3])
      })

    })
    
    //////////////////////////////////////////////////////////////////////////////
    // Operators*
    //////////////////////////////////////////////////////////////////////////////
    describe('Operators*', function () {
      it('compares with equals()', function () {
        const bitmask_a = small_random_set.bitmask(_.shuffle([9, 2, 4, 6, 5])) // Test shuffling
        const bitmask_b = small_random_set.bitmask(_.shuffle([9, 2, 4, 6, 5])) // Test shuffling
        const bitmask_c = small_random_set.bitmask([9, 2, 4, 6, 5])
        const bitmask_d = small_random_set.bitmask([5, 9, 6, 2, 4])

        assert(bitmask_a.equals(bitmask_b))
        assert(bitmask_a.equals(bitmask_c))
        assert(bitmask_a.equals(bitmask_d))
        assert(bitmask_c.equals(bitmask_d))
      })

      it('works with unitary plus ("+") (+bitmask) and valueOf()', function () { // Although valueOf() implementation not required
        const bitmask = small_random_set.bitmask([9, 2, 4, 6, 5])

        assert.equal(+bitmask, '0001011101')
        assert.equal(bitmask.valueOf(), '0001011101')
      })

      it('can be compared directly with string', function () { // Although valueOf() implementation not required
        const bitmask = small_random_set.bitmask([9, 2, 4, 6, 5])

        assert(bitmask == '0001011101')
        assert(bitmask, '0001011101')
      })
    })

  })
})
