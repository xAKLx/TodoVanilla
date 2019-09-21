
export class Modal {
  constructor(node) {
    this.node = node;

    ['open', 'close'].forEach(name => this[name] = this[name].bind(this));
    node.onclick = event => {
      if ( event.target === node ) { 
        this.close(); 
      }
    }
  }

  open() {
    this.node.style.display = 'flex';
  }

  close() {
    this.node.style.display = 'none';
  }

}