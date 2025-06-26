$(document).ready(function () {
  const selectedDate = localStorage.getItem("selectedDate");
  if (!selectedDate) {
    alert("Please select a date first.");
    window.location.href = "index.html";
    return;
  }

  $("#currentDay").text("Schedule for: " + moment(selectedDate).format("MMMM Do YYYY"));

  const currentHour = parseInt(moment().format("HH"));
  const container = $("#timeBlocks");

  // Generate time blocks
  for (let hour = 6; hour <= 18; hour++) {
    const hourStr = hour < 10 ? "0" + hour : hour;
    const displayHour = moment(hourStr, "HH").format("h A");
    const value = localStorage.getItem(`${selectedDate}-${hourStr}`) || "";

    let timeClass = "";
    if (hour < currentHour) timeClass = "past";
    else if (hour === currentHour) timeClass = "present";
    else timeClass = "future";

    container.append(`
      <div class="row ${timeClass}" id="hour-${hourStr}">
        <div class="hour">${displayHour}</div>
        <textarea class="time-block description" data-hour="${hourStr}">${value}</textarea>
        <button class="saveBtn" aria-label="save">&#10004;</button>
      </div>
    `);
  }

  // Extra block for other tasks
  const extraValue = localStorage.getItem(`${selectedDate}-extra`) || "";
  container.append(`
    <div class="row future" id="hour-extra">
      <div class="hour">Other</div>
      <textarea class="time-block description" data-hour="extra" placeholder="Add any other time/task here...">${extraValue}</textarea>
      <button class="saveBtn" aria-label="save">&#10004;</button>
    </div>
  `);

  // Save button handler (manual save & cross out)
  $(".saveBtn").click(function () {
    const block = $(this).closest(".row");
    const textarea = block.find("textarea");
    const timeId = textarea.data("hour");
    const text = textarea.val();

    if (text.trim() === "") {
      localStorage.removeItem(`${selectedDate}-${timeId}`);
      textarea.removeClass("completed");
    } else {
      localStorage.setItem(`${selectedDate}-${timeId}`, text);
      textarea.toggleClass("completed");
    }
  });

  // Auto-save on textarea change
  $(".time-block").on("input", function () {
    const timeId = $(this).data("hour");
    const text = $(this).val();
    if (text.trim() === "") {
      localStorage.removeItem(`${selectedDate}-${timeId}`);
    } else {
      localStorage.setItem(`${selectedDate}-${timeId}`, text);
    }
  });

  // Clear all tasks
  $("#clearFieldsBtn").click(function () {
    for (let hour = 6; hour <= 18; hour++) {
      const hourStr = hour < 10 ? "0" + hour : hour;
      localStorage.removeItem(`${selectedDate}-${hourStr}`);
    }
    localStorage.removeItem(`${selectedDate}-extra`);
    $("textarea").val("");
  });

  // Notification for upcoming tasks
  function checkAndNotifyTasks() {
    if (!("Notification" in window)) return;

    Notification.requestPermission().then(permission => {
      if (permission !== "granted") return;

      const now = moment();
      for (let hour = 6; hour <= 18; hour++) {
        const hourStr = hour < 10 ? "0" + hour : hour;
        const task = localStorage.getItem(`${selectedDate}-${hourStr}`);
        if (task && task.trim()) {
          const taskTime = moment(selectedDate + " " + hourStr, "YYYY-MM-DD HH");
          const diffMinutes = taskTime.diff(now, "minutes");
          if (diffMinutes === 5) {
            new Notification("Upcoming Task", {
              body: `${task} in 5 minutes`,
              icon: "https://cdn-icons-png.flaticon.com/512/1827/1827301.png"
            });
          }
        }
      }
    });
  }
  setInterval(checkAndNotifyTasks, 60000); // check every 1 min

  // Export as PDF using jsPDF (reads from textareas for latest edits)
  const exportBtn = document.getElementById("exportPDFBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Schedule for: ${moment(selectedDate).format("MMMM Do YYYY")}`, 10, 20);

      let y = 30;
      $(".row").each(function () {
        const label = $(this).find(".hour").text().trim();
        const task = $(this).find("textarea").val().trim();
        if (label && (task || label === "Other")) {
          doc.setFontSize(12);
          doc.text(`${label}: ${task}`, 10, y);
          y += 10;
        }
      });

      doc.save(`Schedule_${selectedDate}.pdf`);
    });
  }
});
