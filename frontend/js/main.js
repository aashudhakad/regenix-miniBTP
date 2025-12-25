document.addEventListener("DOMContentLoaded", function() {
  // Check if user details prompt has been shown before
  if (!localStorage.getItem('userDetailsAsked')) {
    const wantsDetails = confirm("Would you like to enter your user details?");
    if (wantsDetails) {
      window.location.href = "user-details.html";
    }
    localStorage.setItem('userDetailsAsked', 'true');
  }

  // Set up exercise card click handlers
  const exerciseCards = document.querySelectorAll('.exercise-card');
  exerciseCards.forEach(card => {
    card.addEventListener('click', () => {
      const exerciseName = card.getAttribute('data-exercise');
      window.location.href = `exercise.html?exercise=${exerciseName}`;
    });
  });
});
