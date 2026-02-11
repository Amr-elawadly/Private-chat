        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
        import {
            getDatabase,
            ref,
            push,
            onChildAdded,
            onChildChanged,
            update,
            onValue,
            onDisconnect,
            set
        } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

        /* FIREBASE CONFIG */
        const firebaseConfig = {
            apiKey: "AIzaSyBu7A1TmO6cJFZnyBAAoLZl2PxyWrbE33c",
            authDomain: "private-amr.firebaseapp.com",
            databaseURL: "https://private-amr-default-rtdb.firebaseio.com",
            projectId: "private-amr",
            storageBucket: "private-amr.firebasestorage.app",
            messagingSenderId: "182229028966",
            appId: "1:182229028966:web:1c3c3cbbf5c0aae20c5da7"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);

        /* USERNAME */
        let username = "";
        while (!username) {
            username = prompt("Enter your name:");
        }

        /* ELEMENTS */
        const messagesRef = ref(db, "messages");
        const chatMessages = document.getElementById("chatMessages");
        const input = document.getElementById("messageInput");
        const typingStatus = document.getElementById("typingStatus");

        /* SEND MESSAGE */
        window.sendMessage = function () {
            const text = input.value.trim();
            if (!text) return;

            push(messagesRef, {
                user: username,
                message: text,
                seen: false,
                time: Date.now()
            });

            input.value = "";
        };

        /* ADD MESSAGE */
        onChildAdded(messagesRef, snapshot => {
            renderMessage(snapshot.key, snapshot.val());
        });

        /* UPDATE SEEN */
        onChildChanged(messagesRef, snapshot => {
            const msgDiv = document.getElementById(snapshot.key);
            if (!msgDiv) return;

            const seenDiv = msgDiv.querySelector(".seen");
            if (seenDiv) {
                seenDiv.innerText = snapshot.val().seen ? "✔✔ Seen" : "✔ Sent";
            }
        });

        /* RENDER MESSAGE */
        function renderMessage(key, data) {
            const msgDiv = document.createElement("div");
            msgDiv.className = "message " + (data.user === username ? "sent" : "received");
            msgDiv.id = key;

            msgDiv.innerHTML = `
        <strong>${data.user}</strong><br>
        ${data.message}
        ${data.user === username
                    ? `<div class="seen">${data.seen ? "✔✔ Seen" : "✔ Sent"}</div>`
                    : ""
                }
    `;

            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            /* MARK AS SEEN */
            if (data.user !== username && !data.seen) {
                update(ref(db, "messages/" + key), { seen: true });
            }
        }





        /* =========================
           TYPING INDICATOR
        ========================= */

        const typingRef = ref(db, "typing/" + username);
        let typingTimeout;

        /* WHEN USER TYPES */
        input.addEventListener("input", () => {
            set(typingRef, true);

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                set(typingRef, false);
            }, 2000);
        });

        /* REMOVE TYPING ON DISCONNECT */
        onDisconnect(typingRef).remove();

        /* LISTEN FOR OTHERS TYPING */
        onValue(ref(db, "typing"), snapshot => {
            let usersTyping = [];

            snapshot.forEach(child => {
                if (child.key !== username && child.val() === true) {
                    usersTyping.push(child.key);
                }
            });

            typingStatus.innerText =
                usersTyping.length > 0
                    ? usersTyping.join(", ") + " is typing..."
                    : "";
        });

        /* =========================
   ONLINE USERS COUNT
========================= */

        // unique id لكل session
        const userId = Date.now() + "_" + Math.floor(Math.random() * 10000);

        // reference للمستخدم
        const onlineUserRef = ref(db, "online/" + userId);

        // سجل المستخدم online
        set(onlineUserRef, {
            name: username,
            online: true
        });

        // شيل المستخدم لما يقفل الصفحة
        onDisconnect(onlineUserRef).remove();

        // عدّ المستخدمين الأونلاين
        onValue(ref(db, "online"), snapshot => {
            let count = 0;

            snapshot.forEach(() => {
                count++;
            });

            const onlineDiv = document.getElementById("onlineUsers");
            if (onlineDiv) {
                onlineDiv.innerText = "Online: " + count;
            }
        });
