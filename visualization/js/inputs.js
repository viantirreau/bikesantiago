const selectedDay = document.querySelector("#selected-day");
const dayOptionsContainer = document.querySelector("#day-options-container");
const dayOptionsList = document.querySelectorAll(".day-option");

selectedDay.addEventListener("click", () => {
    dayOptionsContainer.classList.toggle("active");
});

dayOptionsList.forEach(option => {
    option.addEventListener("click", () => {
        selectedDay.innerHTML = option.querySelector("label").innerHTML;
        dayOptionsContainer.classList.remove("active");
    });
});

const selectedHour = document.querySelector("#selected-hour");
const hourOptionsContainer = document.querySelector("#hour-options-container");
const hourOptionsList = document.querySelectorAll(".hour-option");

selectedHour.addEventListener("click", () => {
    hourOptionsContainer.classList.toggle("active");
});

hourOptionsList.forEach(option => {
    option.addEventListener("click", () => {
        selectedHour.innerHTML = option.querySelector("label").innerHTML;
        hourOptionsContainer.classList.remove("active");
    });
});