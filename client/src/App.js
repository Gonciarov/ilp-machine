import React, { useEffect, useState } from 'react'

function App() {

  const [backendData, setBackendData] = useState([{}])
  useEffect(() => {
    fetch("/test").then(
      response => response.json()
      ).then(
        data => {
          setBackendData(data)
          console.log(data)
        }
      )
    
  }, [])

  return (
    <div>
      {(typeof backendData.prisonNumber === 'undefined') ? (
        <p>Loading...</p>
      ) : (
        backendData.prisonNumber.map((user, i) => (
          <p key={i}>{user}</p>
        ))
      )}
    </div>
  )
}

export default App;
