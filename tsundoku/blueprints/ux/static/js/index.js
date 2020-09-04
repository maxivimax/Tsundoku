var None = null;
var entriesToDelete = [];


function submitAddOrEditShowForm(event) {
    event.preventDefault();
    let url = $(this).closest("form").attr("action");
    let method = $(this).closest("form").attr("method");
    let data = $(this).closest("form").serialize();

    for (const entry of entriesToDelete) {
        // entry[0] is show_id, entry[1] is entry_id
        deleteShowEntry(entry[0], entry[1]);
    }

    $.ajax(
        {
            url: url,
            type: method,
            data: data,
            success: function (data) {
                location.reload();
            },
            error: function (jqXHR, status, error) {
                alert("There was an error processing the request.");
            }
        }
    );
}


function addShowEntryFormSubmit(event) {
    event.preventDefault();

    let form = $(this).closest("form");
    let url = form.attr("action");
    let method = form.attr("method");
    let data = form.serialize();
    $.ajax(
        {
            url: url,
            type: method,
            data: data,
            success: function (data) {
                data = JSON.parse(data);
                let entry = data.entry;
                addRowToShowEntryTable(entry);
            },
            error: function (jqXHR, status, error) {
                alert("There was an error processing the request.");
            }
        }
    );
}


function addRowToShowEntryTable(entry) {
    let table = document.querySelector("#show-entry-table tbody");
    let row = table.insertRow(-1);

    let cell_episode = row.insertCell(0);
    let cell_status = row.insertCell(1);
    let cell_delete = row.insertCell(2);

    $(cell_episode).html(entry.episode);
    $(cell_status).html(entry.current_state);

    let deleteBtn = document.createElement("button");
    $(deleteBtn).addClass("delete");
    $(deleteBtn).on("click", function() {
        bufferShowEntryDeletion(entry.show_id, entry.id);
        this.parentNode.parentNode.remove();
    })

    cell_delete.appendChild(deleteBtn);
}


function bufferShowEntryDeletion(show_id, entry_id) {
    entriesToDelete.push([show_id, entry_id]);
}


function deleteShowEntry(show_id, entry_id) {
    let url = `/api/shows/${show_id}/entries/${entry_id}`;
    $.ajax(
        {
            url: url,
            type: "DELETE"
        }
    );
}


function deleteShowCache(show_id) {
    let url = `/api/shows/${show_id}/cache`;
    $.ajax(
        {
            url: url,
            type: "DELETE",
            success: function() {
                window.location.reload();
            }
        }
    );
}


function displayShowInfo() {
    $("#show-info-tab").addClass("is-active");
    $("#show-entry-tab").removeClass("is-active");

    $("#edit-show-form").removeClass("is-hidden");
    $("#entry-tab-display").addClass("is-hidden");
}


function displayShowEntries() {
    $("#show-info-tab").removeClass("is-active");
    $("#show-entry-tab").addClass("is-active");

    $("#edit-show-form").addClass("is-hidden");
    $("#entry-tab-display").removeClass("is-hidden");
}


function openAddShowModal() {
    let form = $("#add-show-form");

    form.trigger("reset");

    form.attr("action", "/api/shows");
    form.attr("method", "POST");
    form.on("submit", submitAddOrEditShowForm);

    $(document.documentElement).addClass("is-clipped");
    $("#add-show-modal").addClass("is-active");
}


function openEditShowModal(show) {
    let form = $("#edit-show-form");
    let addEntryForm = $("#add-show-entry-form");

    let table = $("#show-entry-table tbody");

    displayShowInfo();
    form.trigger("reset");
    addEntryForm.trigger("reset");

    $("#edit-show-form :input").each(function() {
        $(this).val(show[this.name])
    });

    $("#fix-match-input").val(show.kitsu_id);

    table.empty();

    for (const entry of show.entries) {
        addRowToShowEntryTable(entry);
    }

    $("#entry-table-caption").html(show.title);

    form.attr("action", `/api/shows/${show.id}`);
    form.attr("method", "PUT");
    form.on("submit", submitAddOrEditShowForm);

    addEntryForm.attr("action", `/api/shows/${show.id}/entries`);
    addEntryForm.attr("method", "POST");
    addEntryForm.on("submit", addShowEntryFormSubmit);

    $("#del-cache-btn").on("click", function() {
        deleteShowCache(show.id);
    })

    $(document.documentElement).addClass("is-clipped");
    $("#edit-show-modal").addClass("is-active");
}


function openDeleteShowModal(show) {
    $("#delete-show-button").on("click", function(e) {
        e.preventDefault();
        $.ajax(
            {
                url: `/api/shows/${show.id}`,
                type: "DELETE",
                success: function () {
                    location.reload();
                }
            }
        );
    });

    $(document.documentElement).addClass("is-clipped");
    $("#delete-show-modal").addClass("is-active");
}


function toggleFixMatchDropdown() {
    $("#fix-match-dropdown").toggleClass("is-active");
}


function closeModals() {
    entriesToDelete = [];
    $(".modal").removeClass("is-active");
    $(document.documentElement).removeClass("is-clipped");
}


$(document).ready(function() {
    $('.notification .delete').each(function () {
        $(this).on("click", function () {
            $(this).parent().remove();
        })
    });

    $("#fix-match-input").on("change", function() {
        $("input[name='kitsu_id']").val($(this).val());
    });
});