
import './App.css';
import {useEffect, useState} from "react";
import UserStory1 from "./component/userStory1";
import UserStory2 from "./component/userStory2";


function App() {

    // useEffect(() => {
    //     // Function to perform the PUT request
    //     const initializeDataset = async () => {
    //         try {
    //             const response = await fetch(
    //                 'http://localhost:your_server_port/dataset/your_id/your_kind',
    //                 {
    //                 method: 'PUT',
    //                 headers: {
    //                     'Content-Type': 'application/x-zip-compressed',
    //                 },
    //                 body: fs.readFileSync("test/resources/archives/pair.zip"),
    //             });
    //
    //             if (response.ok) {
    //                 console.log('Dataset initialized successfully');
    //                 // Optionally, trigger any additional actions after dataset is initialized
    //             } else {
    //                 console.error('Failed to initialize dataset:', response.status);
    //             }
    //         } catch (error) {
    //             console.error('Error initializing dataset:', error);
    //         }
    //     };
    //
    //     // Call the function to initialize the dataset
    //     initializeDataset().then();
    // }, []);

  return (
      <div className="App">
          <header className="App-header">
              <h1>UBC Insight Facade</h1>
          </header>

          <UserStory1 />
          <UserStory2 />
      </div>

  );
}

export default App;
