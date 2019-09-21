
export class Form { 
  constructor(node) {
    this.node = node;
    this.onSubmitListener = [];
    this.onCancelListener = [];

    ['addOnSubmitListener', 'addOnCancelListener', 'reset'].forEach(name => this[name] = this[name].bind(this));

    node.onsubmit = event => {
      this.onSubmitListener.forEach(listener => listener(event));
    }

    node.cancel.onclick = event => {
      event.preventDefault();
      this.onCancelListener.forEach(listener => listener(event));
    }
  }

  addOnSubmitListener(listener) {
    this.onSubmitListener.push(listener);
  }

  addOnCancelListener(listener) {
    this.onCancelListener.push(listener);
  }

  reset() {
    this.node.reset();
  }
}