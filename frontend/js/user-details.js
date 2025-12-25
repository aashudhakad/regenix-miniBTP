document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("user-details-form");
  const tableContainer = document.getElementById("user-details-table-container");
  const tableBody = document.getElementById("user-details-data");
  
  // Check if we have stored user details and display them
  const storedUserDetails = localStorage.getItem('userDetails');
  if (storedUserDetails) {
    const userInfo = JSON.parse(storedUserDetails);
    
    // Fill the form with stored values
    document.getElementById("name").value = userInfo.name || "";
    document.getElementById("age").value = userInfo.age || "";
    document.getElementById("height").value = userInfo.height || "";
    document.getElementById("weight").value = userInfo.weight || "";
    document.getElementById("goalWeight").value = userInfo.goalWeight || "";
    document.getElementById("fitnessGoal").value = userInfo.fitnessGoal || "";
    
    // Show the table with stored data
    displayUserDetailsTable(userInfo);
  }
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const userInfo = {
      name: document.getElementById("name").value,
      age: document.getElementById("age").value,
      height: document.getElementById("height").value,
      weight: document.getElementById("weight").value,
      goalWeight: document.getElementById("goalWeight").value,
      fitnessGoal: document.getElementById("fitnessGoal").value
    };
    
    // Store the user details in localStorage
    localStorage.setItem('userDetails', JSON.stringify(userInfo));
    
    // Display the user details table
    displayUserDetailsTable(userInfo);
  });
  
  function displayUserDetailsTable(userInfo) {
    // Clear any existing table data
    tableBody.innerHTML = '';
    
    // Create a new table row with user data
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${userInfo.name}</td>
      <td>${userInfo.age}</td>
      <td>${userInfo.height}</td>
      <td>${userInfo.weight}</td>
      <td>${userInfo.goalWeight}</td>
      <td>${userInfo.fitnessGoal}</td>
    `;
    
    tableBody.appendChild(row);
    
    // Show the table container
    tableContainer.style.display = 'block';
  }
});
