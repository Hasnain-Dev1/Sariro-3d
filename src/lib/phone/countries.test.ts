import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTRY_LIST, countryByCode, countriesForDial, splitE164, toE164,
  checkNational, stripTrunkPrefix, formatE164, smsReachable, guessCountry,
  DEFAULT_COUNTRY,
} from './countries';

/**
 * SARIRO — keeping the country and the dialling code apart
 * ============================================================================
 * The bug this exists to prevent already happened. The Rakhecha family live in
 * India and carry a Nepali number, and for a while one of their four accounts
 * said +91 because somebody reasoned "they're in India, so the number starts
 * +91". Those same ten digits under +91 belong to a stranger.
 *
 * So the tests below care most about the joins between the two facts: that a
 * number splits back to the country it was actually stored with, and that
 * nothing here ever infers one from the other.
 */

describe('the list itself', () => {
  test('India is first, because most customers are there', () => {
    assert.equal(COUNTRY_LIST[0].code, 'IN');
  });

  test('every country the live database actually uses is present', () => {
    for (const code of ['IN', 'NP', 'PK', 'CD']) {
      assert.ok(countryByCode(code), `${code} is on the live data and must be pickable`);
    }
  });

  test('dial codes never carry a plus — it is added at display time', () => {
    for (const c of COUNTRY_LIST) {
      assert.doesNotMatch(c.dial, /\+/, `${c.code} dial "${c.dial}"`);
      assert.match(c.dial, /^\d+$/, `${c.code} dial "${c.dial}"`);
    }
  });

  test('ISO codes are unique — they are the storage key', () => {
    const codes = COUNTRY_LIST.map((c) => c.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  test('lookup is case- and space-insensitive, and safe on nothing', () => {
    assert.equal(countryByCode('in')?.code, 'IN');
    assert.equal(countryByCode('  IN  ')?.code, 'IN');
    assert.equal(countryByCode(null), null);
    assert.equal(countryByCode(''), null);
    assert.equal(countryByCode('ZZ'), null);
  });
});

describe('a dial code can belong to more than one country', () => {
  /* +1 is the US and Canada. Pretending otherwise would silently relabel every
     Canadian customer as American. */
  test('+1 returns both, and neither is picked for you', () => {
    const hits = countriesForDial('1').map((c) => c.code);
    assert.deepEqual(new Set(hits), new Set(['US', 'CA']));
  });

  test('a plus in the input is tolerated', () => {
    assert.equal(countriesForDial('+91')[0].code, 'IN');
  });

  test('nothing sensible in, empty list out', () => {
    assert.deepEqual(countriesForDial(''), []);
    assert.deepEqual(countriesForDial('abc'), []);
  });
});

describe('splitting a stored number back apart', () => {
  test('the four real shapes on the live database', () => {
    assert.equal(splitE164('+919709123454').country?.code, 'IN');
    assert.equal(splitE164('+9779709123454').country?.code, 'NP');
    assert.equal(splitE164('+923314565218').country?.code, 'PK');
    assert.equal(splitE164('+243898904440').country?.code, 'CD');
  });

  /* The reason dial codes are matched longest-first. +977 must not be read as
     +9 and a stray 77, and +91 must not be read as +9 then 1. */
  test('the longest dial code wins', () => {
    const np = splitE164('+9779709123454');
    assert.equal(np.country?.code, 'NP');
    assert.equal(np.national, '9709123454');

    const ind = splitE164('+919709123454');
    assert.equal(ind.country?.code, 'IN');
    assert.equal(ind.national, '9709123454');
  });

  /* The whole point of the module: identical digits, different countries,
     and neither one is inferred from the other. */
  test('the same ten digits under two codes stay two different numbers', () => {
    const a = splitE164('+919709123454');
    const b = splitE164('+9779709123454');
    assert.equal(a.national, b.national);
    assert.notEqual(a.country?.code, b.country?.code);
    assert.notEqual(a.e164, b.e164);
  });

  test('spaces and dashes do not confuse it', () => {
    assert.equal(splitE164('+91 97091 23454').e164, '+919709123454');
    assert.equal(splitE164('+977-970-912-3454').country?.code, 'NP');
  });

  test('a bare number has no country, and says so', () => {
    const s = splitE164('9709123454');
    assert.equal(s.country, null);
    assert.equal(s.e164, null);
    assert.equal(s.national, '9709123454');
  });

  test('empty and null are handled', () => {
    for (const v of [null, undefined, '', '   ']) {
      const s = splitE164(v);
      assert.equal(s.country, null);
      assert.equal(s.e164, null);
    }
  });

  test('an unknown dial code keeps the number rather than losing it', () => {
    const s = splitE164('+99912345678');
    assert.equal(s.country, null);
    assert.equal(s.e164, '+99912345678');
  });

  test('a dial code with nothing after it is not a number', () => {
    assert.equal(splitE164('+91').country, null);
  });
});

describe('building the stored value', () => {
  test('country plus national makes E.164', () => {
    assert.equal(toE164('IN', '9709123454'), '+919709123454');
    assert.equal(toE164('NP', '9709123454'), '+9779709123454');
  });

  test('it round-trips through split', () => {
    for (const [code, n] of [['IN', '9876543211'], ['NP', '9709123454'], ['PK', '3314565218']] as const) {
      const e = toE164(code, n)!;
      const back = splitE164(e);
      assert.equal(back.country?.code, code);
      assert.equal(back.national, n);
    }
  });

  test('typed punctuation is stripped', () => {
    assert.equal(toE164('IN', '97091 23454'), '+919709123454');
    assert.equal(toE164('IN', '(970) 912-3454'), '+919709123454');
  });

  test('missing pieces produce null, not a broken string', () => {
    assert.equal(toE164('ZZ', '9709123454'), null);
    assert.equal(toE164('IN', ''), null);
    assert.equal(toE164('IN', 'abc'), null);
  });

  /* `+91 09876543210` rings nothing. The habitual leading 0 has to come off
     before the dial code goes on. */
  test('the trunk prefix comes off', () => {
    assert.equal(stripTrunkPrefix('09876543211'), '9876543211');
    assert.equal(stripTrunkPrefix('0 98765 43211'), '9876543211');
    assert.equal(stripTrunkPrefix('9876543211'), '9876543211');
  });
});

describe('checking a national number against its country', () => {
  test('a good Indian mobile passes', () => {
    assert.equal(checkNational('IN', '9709123454').ok, true);
    assert.equal(checkNational('IN', '6296914378').ok, true);
  });

  test('an Indian landline trunk code is refused, with the reason', () => {
    const r = checkNational('IN', '2296914378');
    assert.equal(r.ok, false);
    assert.match(r.problem, /6, 7, 8 or 9/);
  });

  test('short and long Indian numbers say which', () => {
    assert.match(checkNational('IN', '97091').problem, /5 digits short/);
    assert.match(checkNational('IN', '9709123454321').problem, /10 digits/);
  });

  test('one digit short is singular', () => {
    assert.match(checkNational('IN', '970912345').problem, /1 digit short/);
  });

  test('other countries are checked on length only', () => {
    assert.equal(checkNational('NP', '9709123454').ok, true);
    assert.equal(checkNational('QA', '12345678').ok, true);
    assert.match(checkNational('QA', '123').problem, /8 digits/);
  });

  test('a country with several valid lengths accepts all of them', () => {
    assert.equal(checkNational('MY', '123456789').ok, true);
    assert.equal(checkNational('MY', '1234567890').ok, true);
    assert.match(checkNational('MY', '12345').problem, /9 or 10/);
  });

  test('a country with no declared length falls back to a sane range', () => {
    assert.equal(checkNational('DE', '15112345678').ok, true);
    assert.equal(checkNational('DE', '123').ok, false);
  });

  test('no country and no number are both refused with something readable', () => {
    assert.match(checkNational('', '9709123454').problem, /choose a country/i);
    assert.match(checkNational('IN', '').problem, /enter your phone/i);
  });
});

describe('display', () => {
  test('a ten-digit number is grouped for reading aloud', () => {
    assert.equal(formatE164('+919709123454'), '+91 97091 23454');
  });

  test('a number we cannot split is shown as it was stored, not blanked', () => {
    assert.equal(formatE164('9709123454'), '9709123454');
    assert.equal(formatE164(''), '');
    assert.equal(formatE164(null), '');
  });
});

describe('who our SMS provider can actually reach', () => {
  /* apitxt delivers to India. Everywhere else the request is accepted and the
     message never arrives, so the product has to know rather than showing a
     foreign parent a code box that can never be satisfied. */
  test('India yes, everywhere else no', () => {
    assert.equal(smsReachable('IN'), true);
    assert.equal(smsReachable('NP'), false);
    assert.equal(smsReachable('PK'), false);
    assert.equal(smsReachable('US'), false);
  });

  test('case and nothing are handled', () => {
    assert.equal(smsReachable('in'), true);
    assert.equal(smsReachable(null), false);
    assert.equal(smsReachable(''), false);
  });
});

describe('the initial value of the picker — a convenience, never a record', () => {
  test('Indian timezones', () => {
    assert.equal(guessCountry('Asia/Kolkata'), 'IN');
    assert.equal(guessCountry('Asia/Calcutta'), 'IN');
  });

  test('the ones on the live data', () => {
    assert.equal(guessCountry('Asia/Kathmandu'), 'NP');
    assert.equal(guessCountry('Asia/Karachi'), 'PK');
  });

  test('anything in the Americas defaults to US rather than to India', () => {
    assert.equal(guessCountry('America/New_York'), 'US');
    assert.equal(guessCountry('America/Toronto'), 'US');
  });

  test('unknown or missing falls back to the default', () => {
    assert.equal(guessCountry('Mars/Olympus'), DEFAULT_COUNTRY);
    assert.equal(guessCountry(null), DEFAULT_COUNTRY);
    assert.equal(guessCountry(''), DEFAULT_COUNTRY);
  });

  test('every guess is a country that is actually in the picker', () => {
    const zones = ['Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Dubai', 'Europe/London',
                   'America/New_York', 'Africa/Kinshasa', 'Pacific/Auckland', 'nonsense'];
    for (const z of zones) {
      assert.ok(countryByCode(guessCountry(z)), `${z} guessed a country not in the list`);
    }
  });
});
