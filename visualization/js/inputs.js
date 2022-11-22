const selectedDay = document.querySelector("#selected-day");
const dayOptionsContainer = document.querySelector("#day-options-container");
const dayOptionsList = document.querySelectorAll(".day-option");

selectedDay.addEventListener("click", () => {
    dayOptionsContainer.classList.toggle("active");
    hourOptionsContainer.classList.remove("active");
    availabilityOptionsContainer.classList.remove("active");
});

dayOptionsList.forEach(option => {
    option.addEventListener("click", () => {
        SELECTED_DAY = +option.querySelector(".radio").value;
        selectedDay.innerHTML = option.querySelector("label").innerHTML;
        dayOptionsContainer.classList.remove("active");
        renderStations();
        renderHexbin();
    });
});

const selectedHour = document.querySelector("#selected-hour");
const hourOptionsContainer = document.querySelector("#hour-options-container");
const hourOptionsList = document.querySelectorAll(".hour-option");

selectedHour.addEventListener("click", () => {
    hourOptionsContainer.classList.toggle("active");
    dayOptionsContainer.classList.remove("active");
    availabilityOptionsContainer.classList.remove("active");
});

hourOptionsList.forEach(option => {
    option.addEventListener("click", () => {
        SELECTED_HOUR = +option.querySelector(".radio").value;
        selectedHour.innerHTML = option.querySelector("label").innerHTML;
        hourOptionsContainer.classList.remove("active");
        renderStations();
        renderHexbin();
    });
});

const selectedAvailability = document.querySelector("#selected-availability");
const availabilityOptionsContainer = document.querySelector("#availability-options-container");
const availabilityOptionsList = document.querySelectorAll(".availability-option");

selectedAvailability.addEventListener("click", () => {
    availabilityOptionsContainer.classList.toggle("active");
    dayOptionsContainer.classList.remove("active");
    hourOptionsContainer.classList.remove("active");
});

availabilityOptionsList.forEach(option => {
    option.addEventListener("click", () => {
        SELECTED_THRESHOLD = +option.querySelector(".radio").value;
        selectedAvailability.innerHTML = option.querySelector("label").innerHTML;
        availabilityOptionsContainer.classList.remove("active");
        renderStations();
        renderHexbin();
    });
});