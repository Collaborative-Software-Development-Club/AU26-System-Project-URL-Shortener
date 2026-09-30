import { useState } from 'react'
import './App.css'

function App() {

  const [url, setUrl] = useState<string>();

  return (
    <>
      <h1>Short Work</h1>
      <div className='content'>
        <div className='url-input'>
          <input type="text" placeholder='Enter a url to shortern!' onChange={e => setUrl(e.target.value)}></input>
          <button onClick={() => {
            alert(url);
          }}>Go!</button>
        </div>
      </div>
    </>
  )
}

export default App
