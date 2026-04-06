const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");

    const nameValue = nameInput.value.trim();
    const emailValue = emailInput.value.trim();

    if (!nameValue || !emailValue) {
      event.preventDefault();
      alert("Please enter both Name and Email before submitting the form.");
      return;
    }

    alert("Thank you. Your message has been submitted.");
  });
}
