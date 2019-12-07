import React, { useState, useRef } from 'react';

let accsessedProperties = [];
const derivationGraph = {};

function observable(targetObject) {
  const ObservableObject = {};

  const keys = Object.keys(targetObject);

  const id = Math.random();

  function getId(key) {
    return `Observable(${id}.${key})`;
  };

  keys.forEach(key => {
    const id = getId(key);

    ObservableObject[key] = targetObject[key];

    if (typeof targetObject[key] !== "function") {
      Object.defineProperty(ObservableObject, key, {
        get() {
          accsessedProperties.push(id);
          return targetObject[key];
        },

        set(val) {
          targetObject[key] = val;

          if (derivationGraph[id]) {
            derivationGraph[id].forEach(fn => {
              fn();
            })
          }
        }
      })
    }
  });

  return ObservableObject;
}

function createReaction(whatShouldWeRunOnChange) {
  return {
    track(functionWhereWeUseObservables) {
      accsessedProperties = [];
      functionWhereWeUseObservables();

      accsessedProperties.forEach((id) => {
        derivationGraph[id] = derivationGraph[id] || [];

        if (derivationGraph[id].indexOf(whatShouldWeRunOnChange) < 0) {
          derivationGraph[id].push(whatShouldWeRunOnChange);
        }
      })
    }
  }
}

function autorun(cb) {
  const reaction = createReaction(cb);

  reaction.track(cb);
}

function UseForceUpdate() {
  const [, set] = useState(0);

  return () => set(val => val + 1);
}

function observer(baseComponent) {
  const Wrapper = () => {
    const forceUpdate = UseForceUpdate();
    const reaction = useRef(null);

    if (!reaction.current) {
      reaction.current = createReaction(forceUpdate);
    }

    let result;

    reaction.current.track(() => {
      result = baseComponent();
    });

    return result;
  };

  return Wrapper;
}

const store = observable({
  count: 0,
  somethingElse: 0,

  increment() {
    this.count += 1;
  }
});

autorun(() => {
  console.log("count autorun", store.count);
});

function App() {
  return (
      <div className="App">
        <h1>Counter {store.count}</h1>
        <button onClick={() => store.increment()} >increment</button>
      </div>
    )
}

const ObserverApp = observer(App);

export default ObserverApp;