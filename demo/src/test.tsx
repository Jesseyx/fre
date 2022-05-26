import { h, Fragment, render, useState } from '../../src';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div class="wrapper">
      <dl>
        <dt>count is</dt>
        <dd>{count}</dd>
      </dl>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

// render(<App />, document.body);
render(<App />, document.getElementById('app'));
