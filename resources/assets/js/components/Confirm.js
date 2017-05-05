import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Modal from './Modal';

//based on http://blog.arkency.com/2015/04/beautiful-confirm-window-with-react/
//and javascript implementation: https://jsfiddle.net/fernandokokocha/p9gqqgp7/
class Confirm extends Component {
  constructor(props) {
    super(props);

  }

  static defaultProps = {
    confirmLabel: 'OK',
    abortLabel: 'Cancel'
  };

  abort(){
    return this.promise.reject();
  }

  confirm(){
    return this.promise.resolve();
  }

  componentDidMount(){
    this.promise = new $.Deferred();
    return ReactDOM.findDOMNode(this.refs.confirm).focus();
  }

  render(){

    var modalBody;

    if (this.props.description) {
      modalBody = (
        <div className='modal-body'>
          {this.props.description}
        </div>
      );
    }

    return (
      <Modal>
        <div className='modal-header'>
          <h4 className='modal-title'>
            {this.props.message}
          </h4>
        </div>
        {modalBody}
        <div className='modal-footer'>
          <div className='text-right'>
            <button
              role='abort'
              type='button'
              className='btn btn-cancel'
              onClick={() => {this.abort()}}
            >
              {this.props.abortLabel}
            </button>
            {' '}
            <button
              role='confirm'
              type='button'
              className='btn btn-accept'
              ref='confirm'
              onClick={() => {this.confirm()}}
            >
              {this.props.confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

export default Confirm;