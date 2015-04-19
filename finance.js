//Finance.js
//For more information, visit http://financejs.org
//Copyright 2014 - 2015 Essam Al Joubori, MIT license

(function () {

var exported_module_name = "financejs"

// .noConflict Pattern boilerplate: only name is set from outside
var current = (function () {
    var name = exported_module_name;
    var root = (typeof window !== 'undefined') ? window : global,
        had = Object.prototype.hasOwnProperty.call(root, name),
        prev = root[name],
        me = root[name] = {};

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = me;
    }

    me.noConflict = function () {
        if (root[name] === me) {
            root[name] = had ? prev : undefined;
            if (!had) {
                try {
                    delete root[name];
                } catch (ex) {
                }
            }
        }
        return me;
    };
    return me;
}()); // .noConflict Pattern ends
// Build up "current"

/*
  ================ New Interface =====================================

 1. Based on http://www.ultimatecalculators.com, formulas are arranged in
 sections.

 2. Lower cases for variables while all-capitalized words for functions.

 3. All sections contain a "doc" property, mainly used for interactive
 documentation. It list all predefined names for variables used in this section.

 4. All functions accept two types of arguments: positional and single object
 argument with properties same as parameters.


 TODO

 1. Have memoization (possibly with "underscore") for functions. Also use this
 cache to build up history.

*/

function ArgumentError(args){
    this.name = "ArgumentError";
    this.message = "ERROR: Arguments missing or invalid!";
    this.args = args;
}

// Will use Function.prototype.toString to extract an array of "arg1", "arg2",
// "arg3" and etc from func, in its exact order!!! Return a function that
// accepts the same prositional arguments as well as an object one.
//
function funcgen(func){
    var params = Function.prototype.toString.call(func)
        .match(/function[^\(]*\((.*?)\)\s*{/)[1].split(", ");

    return function(generated_args){
        var args_array = []
        if (arguments.length === 1){
            var args = arguments[0];
            args_array = params.map(function(par){
                if (! args[par])
                    throw new ArgumentError(arguments);
                return args[par];
            })
        }
        else if (arguments.length === params.length ){
            args_array = arguments;
        }
        else {
            throw "Error: not enough arguments";
        }

        return func.apply(this, args_array);
    };
}

// simple helper function to create doc function
function docgen(docarr){
    return function(){
        console.log( docarr.join('\n') )
    };
}

// http://www.ultimatecalculators.com/compound_interest_calculator.html
current["Compound Interest"] = {
    _FV: function(pv, k, n){
        k = k / 100;
        return pv * Math.pow((1 + k), n);
    },
    doc: docgen(
    [
    "Compound Interest is the interest generated on a principal amount that compounds, that is that interest in one period will be added to principal and interest in the next period will be generated on the now increased principal amount.",
    "* Varables:",
    "  FV = Future value of the principal after compound interest has been applied",
    "  PV = Present value of the principal before compound interest has been applied",
    "  K = The interest rate charged for a compounding period",
    "  N = The number of compounding periods",
    "  I = The amount of interest charged to the principal over the investment time frame"
    ]),
};

(function(){
    this.FV = funcgen(this._FV);
}).call(current["Compound Interest"]);



// ==================  Old Interface  =============================
// Present Value (PV)
current.PV = function (rate, cf1) {
  var rate = rate/100, pv;
  pv = cf1 / (1 + rate);
  return Math.round(pv * 100) / 100;
};

// Future Value (FV)
current.FV = function (rate, cf0, numOfPeriod) {
  var rate = rate/100, fv;
  fv = cf0 * Math.pow((1 + rate), numOfPeriod);
  return Math.round(fv * 100) / 100;
};

// Net Present Value (NPV)
current.NPV = function (rate) {
  var rate = rate/100, npv = arguments[1];
  for (var i = 2; i < arguments.length; i++) {
    npv +=(arguments[i] / Math.pow((1 + rate), i - 1));
  }
  return Math.round(npv * 100) / 100;
};

// Internal Rate of Return (IRR)
current.IRR = function(cfs) {
  var bestGuess, currentNPV;
  var checkNPV = function(rate, arguments){
    var npv = arguments[0];
    // base case
    for (var i = 1; i < arguments.length; i++) {
      npv +=(arguments[i] / Math.pow((1 + rate/100), i));
    }
    currentNPV = Math.round(npv * 100) / 100;
    if (currentNPV <= 0) {
      bestGuess = rate;
      return;
    }
    checkNPV(rate + 0.01, arguments);
  };
  checkNPV(0.01, arguments);
  return Math.round(bestGuess * 100) / 100;
};

// Payback Period (PP)
current.PP = function(numOfPeriods, cfs) {
  // for even cash flows
  if (numOfPeriods === 0) {
    return Math.abs(arguments[1]) / arguments[2];
  }
  // for uneven cash flows
  var cumulativeCashFlow = arguments[1];
  var yearsCounter = 1;
  for (i = 2; i < arguments.length; i++) {
    cumulativeCashFlow += arguments[i];
    if (cumulativeCashFlow > 0) {
      yearsCounter += (cumulativeCashFlow - arguments[i]) / arguments[i];
      return yearsCounter;
    } else {
      yearsCounter++;
    }
  }
};

// Return on Investment (ROI)
current.ROI = function(cf0, earnings) {
  var roi = (earnings - Math.abs(cf0)) / Math.abs(cf0) * 100;
  return Math.round(roi * 100) / 100;
};

// Amortization
current.AM = function (principal, rate, period, yearOrMonth) {
  var ratePerPeriod = rate / 12 / 100;
  // for inputs in years
  if (!yearOrMonth) {
    var numerator = ratePerPeriod * Math.pow((1 + ratePerPeriod), period * 12);
    var denominator = Math.pow((1 + ratePerPeriod), period * 12) - 1;

    var am = principal * (numerator / denominator);
    return Math.round(am * 100) / 100;

  // for inputs in months
  } else if (yearOrMonth === 1) {
    var numerator = ratePerPeriod * Math.pow((1 + ratePerPeriod), period);
    var denominator = Math.pow((1 + ratePerPeriod), period) - 1;

    var am = principal * (numerator / denominator);
    return Math.round(am * 100) / 100;
  } else {
    console.log('not defined');
  }
};

// Profitability Index (PI)
current.PI = function(rate, cfs){
  var totalOfPVs = 0, PI;
  for (var i = 2; i < arguments.length; i++) {
    var discountFactor;
    // calculate discount factor
    discountFactor = 1 / Math.pow((1 + rate/100), (i - 1));
    totalOfPVs += arguments[i] * discountFactor;
  }
  PI = totalOfPVs/Math.abs(arguments[1]);
  return Math.round(PI * 100) / 100;
};

// Discount Factor (DF)
current.DF = function(rate, numOfPeriods) {
  var dfs = [], discountFactor;
  for (var i = 1; i < numOfPeriods; i++) {
    discountFactor = 1 / Math.pow((1 + rate/100), (i - 1));
    roundedDiscountFactor = Math.ceil(discountFactor * 1000)/1000;
    dfs.push(roundedDiscountFactor);
  }
  return dfs;
};

// Compound Interest (CI)
current.CI = function(rate, numOfCompoundings, principal, numOfPeriods) {
  var CI = principal * Math.pow((1 + ((rate/100)/ numOfCompoundings)), numOfCompoundings * numOfPeriods);
  return Math.round(CI * 100) / 100;
};

// Compound Annual Growth Rate (CAGR)
current.CAGR = function(beginningValue, endingValue, numOfPeriods) {
  var CAGR = Math.pow((endingValue / beginningValue), 1 / numOfPeriods) - 1;
  return Math.round(CAGR * 10000) / 100;
};

// Leverage Ratio (LR)
current.LR = function(totalLiabilities, totalDebts, totalIncome) {
  return (totalLiabilities  + totalDebts) / totalIncome;
};

// Rule of 72
current.R72 = function(rate) {
  return 72 / rate;
};

// Weighted Average Cost of Capital (WACC)
current.WACC = function(marketValueOfEquity, marketValueOfDebt, costOfEquity, costOfDebt, taxRate) {
  E = marketValueOfEquity;
  D = marketValueOfDebt;
  V =  marketValueOfEquity + marketValueOfDebt;
  Re = costOfEquity;
  Rd = costOfDebt;
  T = taxRate;

  var WACC = ((E / V) * Re/100) + (((D / V) * Rd/100) * (1 - T/100));
  return Math.round(WACC * 1000) / 10;
};


}()); // namespace proection ends
