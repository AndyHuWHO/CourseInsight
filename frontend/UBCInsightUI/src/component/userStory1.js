import React, { useState } from 'react';

function UserStory1() {
    const [courseInput, setCourseInput] = useState("");
    const [results, setResults] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleCourseInputChange = (event) => {
        setCourseInput(event.target.value);
    };

    const parseCourseInput = () => {
        if (!courseInput.includes("_")) {
            setErrorMessage("Invalid Input. Please input course id in the form: course_id");
            return null;
        } else {
            const [course, id] = courseInput.split('_');
            return { course, id };
        }
    };

    const handleLookupCourse = async () => {
        try {
            if (parseCourseInput() != null) {
                const { course, id } = parseCourseInput();
                const query = {
                    "WHERE": {
                        "AND": [
                            {
                                "IS": {
                                    "sections_dept": course
                                }
                            },
                            {
                                "IS": {
                                    "sections_id": id
                                }
                            },
                            {
                                "GT": {
                                    "sections_year": 2013
                                }
                            }
                        ]
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "sections_dept",
                            "sections_id",
                            "sections_year",
                            "sections_instructor",
                            "sections_pass",
                            "sections_fail",
                            "sections_avg"
                        ],
                        "ORDER": "sections_year"
                    }
                };
                console.log(JSON.stringify(query));

                const response = await fetch('http://localhost:4321/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(query),
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                    setErrorMessage('');
                } else {
                    setResults(null);
                    setErrorMessage(`Failed to fetch data: ${response.status} ${response.body}`);
                }
            }
        } catch (error) {
            console.error('Error processing course input:', error);
            setResults(null);
            setErrorMessage('An error occurred. Please try again.' + error.toString());
        }
    };

    return (
        <div>
            <h2>Lookup A Course</h2>
            <label>
                Enter Course ID in the form (course_id):
                <br/>
                <input type="text" value={courseInput} onChange={handleCourseInputChange} />
            </label>
            <br/>
            <button onClick={handleLookupCourse}>Lookup Course</button>

            {errorMessage !== "" && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {results && results.result.length > 0 ? (
                <table>
                    <thead>
                    <tr>
                        <th>Course Department</th>
                        <th>Course ID</th>
                        <th>Year</th>
                        <th>Professor</th>
                        <th>Pass</th>
                        <th>Fail</th>
                        <th>Average</th>
                    </tr>
                    </thead>
                    <tbody>
                    {results.result.map((result, index) => (
                        <tr key= {index}>
                            <td>{result.sections_dept}</td>
                            <td>{result.sections_id}</td>
                            <td>{result.sections_year}</td>
                            <td>{result.sections_instructor}</td>
                            <td>{result.sections_pass}</td>
                            <td>{result.sections_fail}</td>
                            <td>{result.sections_avg}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                results && <p>
                    Your query generated 0 results.
                    This is either due to there were no sections held for this course after 2013
                    or due to you have entered some course dept or id that are not found in the dataset.</p>
            )}
        </div>
    );
}

export default UserStory1;


