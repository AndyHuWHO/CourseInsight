import './App.css';
import {useEffect, useRef, useState} from "react";
import UserStory1 from "./component/userStory1";
import UserStory2 from "./component/userStory2";
import ubclogo from "./ubc-logo.svg"


function App() {
  return (
      <div className="App">
          <header className="App-header">
              <img src={ubclogo} className="App-logo" alt="logo" />
              <h1>UBC Insight</h1>
          </header>

          <UserStory1 />
          <UserStory2 />
      </div>

  );
}

export default App;


// function App() {
//     const fileInputRef = useRef(null);
//
//     useEffect(() => {
//         const initializeDataset = async () => {
//             try {
//                 if (fileInputRef.current.files.length > 0) {
//                     const formData = new FormData();
//                     formData.append('file', fileInputRef.current.files[0]);
//
//                     const response = await fetch('http://localhost:4321/dataset/frontend/sections', {
//                         method: 'PUT',
//                         headers: {
//                             'Content-Type': 'application/x-zip-compressed',
//                         },
//                         body: formData,
//                     });
//
//                     if (response.ok) {
//                         console.log('Dataset initialized successfully');
//                         // Optionally, trigger any additional actions after dataset is initialized
//                     } else {
//                         console.error('Failed to initialize dataset:', response.status);
//                     }
//                 } else {
//                     console.warn('No file selected');
//                 }
//             } catch (error) {
//                 console.error('Error initializing dataset:', error);
//             }
//         };
//
//         initializeDataset();
//     }, []); // Empty dependency array means run once after initial render
//
//     const handleFileChange = () => {
//         // Trigger file input click
//         fileInputRef.current.click();
//     };
//
//     return (
//         <div className="App">
//             <header className="App-header">
//                 <h1>UBC Insight Facade</h1>
//             </header>
//             <input
//                 type="file"
//                 ref={fileInputRef}
//                 style={{ display: 'none' }}
//                 onChange={() => {
//                     // Handle file selection if needed
//                 }}
//             />
//             <button onClick={handleFileChange}>Select File</button>
//         </div>
//     );
// }
//
// export default App;

