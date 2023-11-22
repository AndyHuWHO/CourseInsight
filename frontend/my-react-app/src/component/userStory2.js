import React, {useState} from "react";

function UserStory2() {
    const [profInput, setProfInput] = useState("");
    const [results, setResults] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleCourseInputChange = (event) => {
        setProfInput(event.target.value);
    };

    const checkProfInput = () => {
        if (!profInput.includes(", ")) {
            setErrorMessage("Invalid Input. Please input professor's name the form: lastName, firstName" +
                "and make sure there's a space after the comma");
            return null;
        }
        return true;
    };

    const handleLookupCourse = async () => {
        try {
            if (checkProfInput() != null) {
                const { course, id } = checkProfInput();
                const query = {
                    "WHERE": {
                        "AND": [
                            {
                                "IS": {
                                    "sections_instructor": profInput
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
            <h2>Lookup A Professor</h2>
            <label>
                Enter the Professor's name in the form (lastName, firstName):
                <br/>
                <input type="text" value={profInput} onChange={handleCourseInputChange} />
            </label>
            <br/>
            <button onClick={handleLookupCourse}>Lookup Professor</button>

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
                    This is either due to either this professor didn't teach a course after 2013
                    or due to you have entered some professor's name that are not found in the dataset.</p>
            )}
        </div>
    );
}

export default UserStory2;
