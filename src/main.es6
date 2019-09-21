import { todoList } from './initialData.es6';
import 'simplebar';
import { Form } from './handleForms';
import { Modal } from './modal';

const todoListModel = createTodoListModel(todoList);

initNav(todoListModel);

const createEntryModal = new Modal(document.getElementById('createEntryModal'));
const createEntryForm = new Form(document.forms.createEntryForm);
createEntryForm.addOnSubmitListener(event => {
  event.preventDefault();

  const [ description, lead, date, time ] = [ 'title', 'lead', 'date', 'time' ].map(x => createEntryForm.node[x].value)

  initTodoList(addEntry(todoListModel,{
    description,
    lead,
    dateTime: new Date(`${date}T${time}`),
    tags: [ ],
    closed: false
  }));
  createEntryModal.close();
});

createEntryForm.addOnCancelListener(() => { createEntryForm.reset(); createEntryModal.close() });

document.getElementById('newTaskButton').onclick = () => { createEntryForm.reset(); createEntryModal.open() };


function initNav(todoListModel) {
  const navNode = document.getElementsByClassName('navigation')[0];
  const labelNodes = [...navNode.children].filter(nodeHasClass('tabLabel'));
  const inkNode = [...navNode.children].find(nodeHasClass('inkBar'));

  const nav = [];
  labelNodes.forEach(labelNode => {
    const labelEntry = {
      id: labelNode.attributes.ref.value,
      node: labelNode,
      active: false
    };

    nav.push(labelEntry);

    labelNode.onclick = () => {
      labelEntry.active = true;
      if (!labelNode.className.split(' ').find(_class => _class === 'active')) {
        labelNode.className += ' active';
      }

      const contentNode = document.getElementById(labelEntry.id);
      if (!contentNode) { return; }

      contentNode.style.display = 'flex';

      nav.filter(x => x.id !== labelEntry.id).forEach(x => {
        x.active = false;
        x.node.className = removeActiveClassFromClassName(x.node.className);

        const contentNode = document.getElementById(x.id);
        if (!contentNode) { return; }

        contentNode.style.display = 'none';
      });

      updateInkNode(inkNode, nav, navNode);
    }
  });

  nav[0].active = true;
  nav[0].node.onclick();

  window.addEventListener("resize", () => {
    updateInkNode(inkNode, nav, navNode);
  });

  initTodoList(todoListModel);

}

function initTodoList(todoListModel) {
  const workNode = document.getElementById('work');
  refreshTodoList(workNode, todoListModel);
}

function createTodoListModel(todoList) {
  todoList = todoList.sort((x, y) => x.dateTime - y.dateTime);
  return divideListByDate(todoList);
}

function refreshTodoList(containerNode, todoListModel) {
  while (containerNode.hasChildNodes()) {
    containerNode.removeChild(containerNode.lastChild);
  }

  todoListModel.map(x => renderTodoListDay(x, todoListModel)).forEach(x => containerNode.appendChild(x));
}

function renderTodoListDay(todoListDay, todoListModel) {
  const today = new Date();
  const closedTodoEntries = todoListDay.list.filter(({ closed }) => closed);

  todoListDay.show = closedTodoEntries.length ? todoListDay.show : 'opened';
  const todoListRender = todoListDay.list
    .filter(({ closed }) => !(closed ^ (todoListDay.show === 'closed')))
    .map(x => renderTodoEntry(x, todoListModel));
  const date = new Date(todoListDay.date);
  const onText = today.toLocaleDateString() === todoListDay.date ? 'Today' : `On ${date.toISOString().split('T')[0]}`;
  const header = `Due ${onText} (${todoListRender.length})`;
  const closedText = !closedTodoEntries.length ? '' : `<button class="todoClosedDayHeader">Closed ${onText} (${closedTodoEntries.length})</button>`;

  const div = document.createElement('div');
  div.innerHTML = `<div class="todoDayHeader"><div class="todoOpenedDayHeader">${header}</div>${closedText}</div>`

  if (closedText !== '') {
    div.children[0].children[1].onclick = () => {
      todoListDay.show = todoListDay.show === 'opened' ? 'closed' : 'opened';
      initTodoList(todoListModel);
    }
  }

  todoListRender.forEach(x => div.appendChild(x));
  return div;
}

function divideListByDate(entries) {
  const results = [];
  let current = {};

  entries.forEach(entry => {
    if (!Object.prototype.hasOwnProperty.call(current, 'date')) {
      current.date = entry.dateTime.toLocaleDateString();
      current.list = [entry];
    } else if (current.date !== entry.dateTime.toLocaleDateString()) {
      results.push(current);
      current = { date: entry.dateTime.toLocaleDateString(), list: [entry] }
    } else {
      current.list.push(entry);
    }
  });

  current.show = 'opened';

  results.push(current);
  return results;
}

function addEntry(datePartitionedEntries, entry) {
  const partition = datePartitionedEntries.find(x => x.date === entry.dateTime.toLocaleDateString());

  if (partition) {
    partition.list = [...partition.list, entry].sort((x, y) => x.dateTime - y.dateTime);
    return datePartitionedEntries;
  }

  return [...datePartitionedEntries, {
    date: entry.dateTime.toLocaleDateString(),
    list: [entry]
  }].sort((x, y) => new Date(x.date) - new Date(y.dateTime))
}

function removeActiveClassFromClassName(className) {
  return removeClassFromClassName(className, 'active');
}

function removeClassFromClassName(className, _class) {
  return className.split(' ').filter(x => x !== _class).join(' ');
}

function nodeHasClass(_class) {
  return node => node.className.split(' ').find(x => x === _class);
}

function updateInkNode(inkNode, nav, navNode) {
  const { node: labelNode } = nav.find(entry => entry.active);
  const { left, right } = labelNode.getBoundingClientRect();

  inkNode.style.left = `${left - navNode.getBoundingClientRect().left}px`;
  inkNode.style.right = `${navNode.getBoundingClientRect().right - right}px`;
}

function renderTodoEntry(todoEntry, todoListModel) {
  const { description, lead, dateTime, tags, closed } = todoEntry;
  let hour = dateTime.getHours();
  let minute = dateTime.getMinutes();
  let amPm = 'AM';

  if (hour >= 12) {
    amPm = 'PM';
    hour -= 12;
  }

  hour = hour === 0 ? 12 : hour;

  const todoEntryNode = document.createElement('div');
  todoEntryNode.className = 'todoEntry';

  const containerNode = document.createElement('label');
  containerNode.className = 'container';
  containerNode.innerHTML = `
  <input type="checkbox" autocomplete="off" ${closed ? 'checked' : ''}>

  <div class="checkmark">
    <div class="mark"></div>
  </div>
  `;

  let y = ({ propertyName }) => {
    if (propertyName === 'opacity') {
      initTodoList(todoListModel);
    }
  }

  containerNode.children[1].addEventListener("transitionend", y);

  containerNode.children[0].onchange = () => {
    todoEntry.closed = containerNode.children[0].checked;
  };

  const todoDataNode = document.createElement('div');
  todoDataNode.className = 'todoData';
  todoDataNode.innerHTML = `
  <div>
    <span>${description}</span>
  </div>

  <div class="metaData">
    <div class="publishingData">
      <span>${lead}</span>
      <div class="circle grayCircle"></div>
      <span>${hour}${minute === 0 ? '' : `:${minute}`} ${amPm}</span>
    </div>

    <div class="chips">
      ${tags.map(renderTag).join('')}
    </div>
  </div>
  `;

  [containerNode, todoDataNode].forEach(x => todoEntryNode.appendChild(x));

  return todoEntryNode;
}

function renderTag({ text, color }) {
  return `<span class="chip" style="background-color: ${color}">${text}</span>`;
}
