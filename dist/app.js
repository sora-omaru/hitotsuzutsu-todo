"use strict";
const $ = (selector) => document.querySelector(selector);
const paths = {
  plus: "M12 5v14M5 12h14",
  x: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  layers: "m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 14h2m4 0h2m-8 4h2",
  "check-circle": "m8 12 3 3 5-6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  shield: "m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 10 3 3 5-6",
  sort: "M8 3v18m-4-4 4 4 4-4M14 5h7m-7 5h5m-5 5h3",
  edit: "m16 3 5 5M4 16 16 4a3 3 0 0 1 4 4L8 20l-5 1 1-5Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.check}"/></svg>`;
}
document.querySelectorAll("[data-icon]").forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});
const STORAGE_KEY = "hitotsuzutsu-tasks-v1";
const categories = { work: "仕事", personal: "プライベート", study: "学び" };
const views = {
  all: "すべてのタスク",
  today: "今日のタスク",
  upcoming: "これからのタスク",
  completed: "完了したタスク",
};
let tasks = [],
  view = "all",
  category = null,
  status = "all",
  editingId = null,
  toastTimer;
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
let today = localDate();
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(saved)) throw new Error("Invalid data");
  tasks = saved.filter(
    (t) =>
      t &&
      typeof t.id === "string" &&
      typeof t.title === "string" &&
      typeof t.done === "boolean" &&
      categories[t.category] &&
      ["low", "normal", "high"].includes(t.priority) &&
      typeof t.due === "string" &&
      typeof t.notes === "string" &&
      Number.isFinite(t.created),
  );
} catch {
  notify("保存データを読み込めませんでした。ブラウザの設定をご確認ください。");
}
function commit(next, message) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    notify(
      "保存できませんでした。ブラウザの空き容量や保存設定をご確認ください。",
    );
    return false;
  }
  tasks = next;
  render();
  if (message) notify(message);
  return true;
}
function baseTasks() {
  return tasks.filter((t) =>
    category
      ? t.category === category
      : view === "today"
        ? t.due === today
        : view === "upcoming"
          ? t.due > today && !t.done
          : view === "completed"
            ? t.done
            : true,
  );
}
function formatDue(due) {
  if (due === today) return "今日";
  const date = new Date(`${due}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getFullYear() !== new Date().getFullYear() ? date.getFullYear() + "/" : ""}${date.getMonth() + 1}/${date.getDate()}`;
}
function render() {
  today = localDate();
  $("#top-date").textContent = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
  const title = category ? categories[category] : views[view];
  $("#view-title").innerHTML = `${title}<span class="heading-dot">.</span>`;
  $("#breadcrumb-title").textContent = title;
  $("#view-description").textContent = category
    ? `${title}のやることを、ひとつずつ整理しよう。`
    : view === "today"
      ? "今日の自分にできることを、自分のペースで。"
      : view === "upcoming"
        ? "これからの予定も、少しずつ準備しよう。"
        : view === "completed"
          ? "ここまでの小さな積み重ね。おつかれさまでした。"
          : "頭の中をすっきりさせて、今日もひとつずつ。";
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.classList.toggle("active", !category && b.dataset.view === view),
    );
  document
    .querySelectorAll("[data-category]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.category === category),
    );
  const open = tasks.filter((t) => !t.done);
  $("#count-all").textContent = open.length;
  $("#count-today").textContent = open.filter((t) => t.due === today).length;
  $("#count-upcoming").textContent = open.filter((t) => t.due > today).length;
  $("#count-completed").textContent = tasks.length - open.length;
  Object.keys(categories).forEach((c) => {
    $(`#count-${c}`).textContent = open.filter((t) => t.category === c).length;
  });
  const done = tasks.length - open.length,
    percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  $("#done-number").textContent = done;
  $("#total-number").textContent = tasks.length;
  $("#progress-percent").textContent = `${percent}%`;
  $("#progress-bar").style.width = `${percent}%`;
  $("#progress-heading").textContent = !tasks.length
    ? "小さな一歩から、はじめよう。"
    : !open.length
      ? "すべて完了。おつかれさまでした！"
      : done
        ? "いい調子。その一歩が、積み重なる。"
        : "今日も、できることからひとつずつ。";
  $("#progress-description").textContent = !tasks.length
    ? "やることを書き出すと、気持ちもちょっと軽くなる。"
    : !open.length
      ? "ひと息ついて、がんばった自分をほめよう。"
      : `残り${open.length}件のタスク。焦らず、あなたのペースで。`;
  const base = baseTasks();
  $("#tab-all").textContent = base.length;
  $("#tab-open").textContent = base.filter((t) => !t.done).length;
  $("#tab-done").textContent = base.filter((t) => t.done).length;
  document
    .querySelectorAll("[data-status]")
    .forEach((b) => b.classList.toggle("active", b.dataset.status === status));
  const query = $("#search").value.trim().toLocaleLowerCase();
  const visible = base.filter(
    (t) =>
      (status === "all" || (status === "done" ? t.done : !t.done)) &&
      `${t.title} ${t.notes}`.toLocaleLowerCase().includes(query),
  );
  const order = { high: 0, normal: 1, low: 2 };
  visible.sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      ($("#sort").value === "priority"
        ? order[a.priority] - order[b.priority]
        : $("#sort").value === "due"
          ? (a.due || "9999").localeCompare(b.due || "9999")
          : 0) ||
      b.created - a.created,
  );
  $("#task-list").innerHTML = visible
    .map(
      (t) =>
        `<article class="task-row ${t.done ? "done" : ""}" data-id="${escapeHTML(t.id)}"><button class="task-check" data-action="toggle" aria-label="${t.done ? "未完了に戻す" : "完了にする"}: ${escapeHTML(t.title)}" aria-pressed="${t.done}">${t.done ? icon("check") : ""}</button><div class="task-body"><button class="task-name" data-action="edit" title="タスクを編集">${escapeHTML(t.title)}</button>${t.notes ? `<p class="task-notes">${escapeHTML(t.notes)}</p>` : ""}<div class="task-meta"><span class="category-badge ${t.category}">${categories[t.category]}</span>${t.due ? `<span class="due-badge ${t.due < today && !t.done ? "overdue" : ""}">${icon("calendar")}${escapeHTML(formatDue(t.due))}${t.due < today && !t.done ? " · 期限超過" : ""}</span>` : ""}${t.priority !== "normal" ? `<span class="priority-badge ${t.priority}">${t.priority === "high" ? "↑ 優先度：高" : "↓ 優先度：低"}</span>` : ""}</div></div><div class="row-actions"><button class="icon-button" data-action="edit" aria-label="タスクを編集">${icon("edit")}</button><button class="icon-button" data-action="delete" aria-label="タスクを削除">${icon("trash")}</button></div></article>`,
    )
    .join("");
  $("#empty-state").hidden = visible.length > 0;
  $("#empty-title").textContent = !tasks.length
    ? "さあ、最初のひとつを。"
    : query
      ? "タスクが見つかりませんでした"
      : "ここには、まだタスクがありません";
  $("#empty-description").innerHTML = !tasks.length
    ? "気になっていること、やってみたいこと。<br>小さなことから、ここに書いてみましょう。"
    : query
      ? "別のキーワードで検索してみましょう。"
      : "表示を切り替えるか、新しいタスクを追加しましょう。";
  $("#empty-add").hidden = !!query;
  $("#list-summary").textContent = !tasks.length
    ? "タスクはまだありません"
    : `${visible.length}件のタスクを表示 · このブラウザに保存済み`;
  $("#clear-completed").hidden = !base.some((t) => t.done);
}
function openEditor(id = null) {
  editingId = id;
  $("#task-form").reset();
  const task = tasks.find((t) => t.id === id);
  $("#dialog-title").textContent = task ? "タスクを編集" : "新しいタスク";
  $("#save-task").textContent = task ? "変更を保存" : "追加する";
  $("#task-title").value = task?.title || "";
  $("#task-notes").value = task?.notes || "";
  $("#task-category").value = task?.category || category || "personal";
  $("#task-priority").value = task?.priority || "normal";
  $("#task-due").value = task?.due || (view === "today" ? today : "");
  $("#task-title").setCustomValidity("");
  $("#task-dialog").showModal();
  $("#task-title").focus();
}
$("#new-task").onclick = () => openEditor();
$("#empty-add").onclick = () => openEditor();
$("#close-dialog").onclick = $("#cancel-dialog").onclick = () =>
  $("#task-dialog").close();
$("#task-title").addEventListener("input", () =>
  $("#task-title").setCustomValidity(""),
);
$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#task-title").value.trim();
  if (!title) {
    $("#task-title").setCustomValidity("タスク名を入力してください。");
    $("#task-title").reportValidity();
    return;
  }
  const values = {
    title,
    notes: $("#task-notes").value.trim(),
    category: $("#task-category").value,
    priority: $("#task-priority").value,
    due: $("#task-due").value,
  };
  const next = editingId
    ? tasks.map((t) => (t.id === editingId ? { ...t, ...values } : t))
    : [
        ...tasks,
        {
          ...values,
          id: crypto.randomUUID(),
          done: false,
          created: Date.now(),
        },
      ];
  if (commit(next, editingId ? "タスクを更新しました" : "タスクを追加しました"))
    $("#task-dialog").close();
});
$("#quick-add").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#quick-title").value.trim();
  if (!title) return;
  if (
    commit(
      [
        ...tasks,
        {
          id: crypto.randomUUID(),
          title,
          notes: "",
          category: category || "personal",
          priority: "normal",
          due: view === "today" ? today : "",
          done: false,
          created: Date.now(),
        },
      ],
      "タスクを追加しました",
    )
  ) {
    $("#quick-title").value = "";
    $("#search").value = "";
    status = "all";
    if (view === "completed" || view === "upcoming") view = "all";
    render();
  }
});
async function confirmDelete(message) {
  const dialog = $("#confirm-dialog");
  $("#confirm-message").textContent = message;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) =>
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "delete"),
      { once: true },
    ),
  );
}
$("#task-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.closest("[data-id]").dataset.id,
    task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (button.dataset.action === "edit") openEditor(id);
  if (button.dataset.action === "toggle") {
    if (
      commit(
        tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        task.done ? "未完了に戻しました" : "ひとつ完了！ おつかれさまでした。",
      )
    ) {
      const next = Array.from(document.querySelectorAll("[data-id]")).find(
        (el) => el.dataset.id === id,
      );
      (next?.querySelector(".task-check") || $("#quick-title")).focus();
    }
  }
  if (
    button.dataset.action === "delete" &&
    (await confirmDelete(
      `「${task.title}」を削除します。削除したタスクは元に戻せません。`,
    ))
  )
    commit(
      tasks.filter((t) => t.id !== id),
      "タスクを削除しました",
    );
});
$("#clear-completed").onclick = async () => {
  const ids = new Set(
    baseTasks()
      .filter((t) => t.done)
      .map((t) => t.id),
  );
  if (
    await confirmDelete(
      `現在の表示に含まれる完了済みタスク${ids.size}件を削除します。削除したタスクは元に戻せません。`,
    )
  )
    commit(
      tasks.filter((t) => !ids.has(t.id)),
      "完了したタスクを削除しました",
    );
};
document.querySelectorAll("[data-view]").forEach(
  (button) =>
    (button.onclick = () => {
      view = button.dataset.view;
      category = null;
      status = "all";
      $("#search").value = "";
      render();
    }),
);
document.querySelectorAll("[data-category]").forEach(
  (button) =>
    (button.onclick = () => {
      category = button.dataset.category;
      view = "all";
      status = "all";
      $("#search").value = "";
      render();
    }),
);
document.querySelectorAll("[data-status]").forEach(
  (button) =>
    (button.onclick = () => {
      status = button.dataset.status;
      render();
    }),
);
$("#search").addEventListener("input", render);
$("#sort").addEventListener("change", render);
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) location.reload();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});
render();
