import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import getErrorDefinition from '../error/errors';

const TOPUP_AMOUNT = 500;

const setCursorPosition = (element) => () => {
  requestAnimationFrame(() => {
    element.selectionStart = element.selectionEnd = element.value.length;
  });
};

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: '',
      exp: '',
      cvc: ''
    };
  }

  handleNumberChange(event) {
    const matches = event.target.value.match(/\d/g);
    const numbers = matches == null ? [] : [...matches];
    const number = numbers.reduce((output, number, index) => {
      const separator = (index % 4 === 0 && index > 0) ? ' ' : '';
      return `${output}${separator}${number}`;
    }, '');

    this.setState({ number: number.substr(0, 19) }, setCursorPosition(event.target));
  }

  handleExpChange(event) {
    let matches = event.target.value.match(/\d/g);

    const previousExp = this.state.exp;
    const separator = ' / ';
    const separatorStartIndex = previousExp.indexOf(separator);

    if (separatorStartIndex > -1) {
      const separatorEndIndex = separatorStartIndex + (separator.length - 1);
      const newExp = event.target.value;
      const removeSeparatorAndPriorDigit = previousExp.length === separatorEndIndex + 1 && newExp.length === separatorEndIndex;
      if (removeSeparatorAndPriorDigit) {
        matches = matches.slice(0, matches.length - 1);
      }
    }

    const numbers = matches == null ? [] : [...matches];
    const exp = numbers.reduce((output, number, index) => {
      const suffix = index === 1 ? `${separator}` : ``;
      return `${output}${number}${suffix}`;
    }, '');
    this.setState({ exp: exp.substr(0, 7) }, setCursorPosition(event.target));
  }

  handleCVCChange(event) {
    const matches = event.target.value.match(/\d/g);
    const numbers = matches == null ? [] : [...matches];
    const cvc = numbers.join('');
    this.setState({ cvc }, setCursorPosition(event.target));
  }

  handleSubmit(e) {
    e.preventDefault();
    const { number, cvc, exp } = this.state;
    const cardDetails = { number, cvc, exp };
    this.props.onSubmit({ topUpAmount: TOPUP_AMOUNT, cardDetails });
  }

  render() {
    const { error, isInitialTopUp, confirmButtonText } = this.props;
    const { number, exp, cvc } = this.state;
    const topUpHeaderText = isInitialTopUp ?
      'To get you started we need to take a £5 top up' :
      'Let\'s update your card and top up £5';
    return (
        <form onSubmit={(e) => this.handleSubmit(e)}>
          {
            error ?
              <div className="red">
                <p>There was a problem collecting payment from your card, please check the details</p>
                <p>
                {
                  error.code
                  ? getErrorDefinition(error.code).message
                  : error.message
                }
                </p>
              </div>
              :
              <div>
                <h2>{topUpHeaderText}<sup>*</sup></h2>
                <p className="h6"><sup>*</sup>Our card processor charges us a fixed fee + a variable fee for every transaction. By grouping your transactions together in to a single top up, we end up paying less and we pass that saving on to you.</p>
              </div>
          }
          <p>
            <input name="number"
              type="text"
              autoComplete="cc-number"
              placeholder="1111 2222 3333 4444"
              className={(error != null && error.param === 'number') ? 'input border-red' : 'input'}
              value={number}
              pattern="[0-9]*"
              noValidate
              onChange={(e) => this.handleNumberChange(e)} />
          </p>
          <p className="register-card-tight">
            <input name="exp"
              type="text"
              autoComplete="cc-exp"
              value={exp}
              pattern="[0-9]*"
              noValidate
              placeholder="Expiry (MM / YY)"
              className={(error != null && error.param === 'exp') ? 'input border-red' : 'input'}
              onChange={(e) => this.handleExpChange(e)} />
            <input name="cvc"
              type="text"
              autoComplete="cc-csc"
              value={cvc}
              pattern="[0-9]*"
              noValidate
              placeholder="CVV (3 or 4-digits)"
              className={(error != null && error.param === 'cvc') ? 'input border-red' : 'input'}
              onChange={(e) => this.handleCVCChange(e)} />
          </p>
          <p><Link className="btn btn-primary btn-big" onClick={(e) => this.handleSubmit(e)}>{confirmButtonText}</Link></p>
        </form>
    );
  }
}

Card.propTypes = {
  isInitialTopUp: React.PropTypes.bool.isRequired,
  confirmButtonText: React.PropTypes.string.isRequired,
  onSubmit: React.PropTypes.func.isRequired
};

const mapStateToProps = ({ error: { inline } }) => ({ error: inline });

export default connect(mapStateToProps)(Card);