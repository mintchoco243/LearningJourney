"use client";

import React from "react";
import { GLHUI } from '@/components/GLHUI';

const { Icon } = GLHUI;

export function AboutModal({ onClose }) {
  return React.createElement("div", {
    className: "modal-bg",
    onClick: onClose,
    style: { zIndex: 99999 }
  },
    React.createElement("div", {
      className: "modal u-card",
      onClick: e => e.stopPropagation(),
      style: {
        width: "100%", maxWidth: 620, padding: 32,
        position: "relative"
      }
    },
      React.createElement("button", {
        onClick: onClose,
        style: {
          position: "absolute", top: 20, right: 20,
          background: "transparent", border: "none", color: "var(--ui-muted)",
          fontSize: 28, cursor: "pointer", lineHeight: 1
        }
      }, "×"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20 } },
        React.createElement("img", { src: "/assets/logo_icon.png", alt: "Garena", style: { height: 40, width: 40, objectFit: "contain" } }),
        React.createElement("div", null,
          React.createElement("h3", { style: { margin: 0, fontSize: 22, fontWeight: 800, color: "var(--ui-heading)" } }, "Về Garena Learning Hub"),
          React.createElement("div", { style: { fontSize: 13, color: "var(--glh-accent)", fontWeight: 700 } }, "Nền tảng đào tạo nội bộ · Garena Vietnam L&D")
        )
      ),
      React.createElement("div", { style: { maxHeight: "80vh", overflowY: "auto", fontSize: 14, lineHeight: 1.7, color: "var(--ui-heading)", marginBottom: 24, display: "flex", flexDirection: "column", gap: 18 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } }, "Learning Hub là gì?"),
          React.createElement("p", { style: { margin: 0, color: "var(--ui-muted)" } }, "Nơi tập trung các khóa học, lịch đào tạo, chính sách học tập và các kênh request hỗ trợ đào tạo tại Garena.")
        ),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } }, "Dành cho ai?"),
          React.createElement("ul", { style: { margin: 0, paddingLeft: 20, color: "var(--ui-muted)" } },
            React.createElement("li", null, "Nhân viên muốn tìm khóa học phù hợp."),
            React.createElement("li", null, "Manager/HRBP muốn tham khảo learning path/recommendation."),
            React.createElement("li", null, "L&D dùng để truyền thông và quản lý thông tin đào tạo.")
          )
        ),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } }, "Có thể làm gì trên site?"),
          React.createElement("ul", { style: { margin: 0, paddingLeft: 20, color: "var(--ui-muted)" } },
            React.createElement("li", null, "Xem khóa học được gợi ý theo vai trò và rank"),
            React.createElement("li", null, "Tìm lịch đào tạo sắp tới"),
            React.createElement("li", null, "Đăng ký tham gia khoá học"),
            React.createElement("li", null, "Gửi yêu cầu học tập hoặc đề xuất khoá mới"),
            React.createElement("li", null, "Xem chính sách L&D của công ty"),
            React.createElement("li", null, "Tra cứu câu hỏi thường gặp (FAQ)")
          )
        ),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } }, "Cách bắt đầu nhanh"),
          React.createElement("ul", { style: { margin: 0, paddingLeft: 20, color: "var(--ui-muted)" } },
            React.createElement("li", null, "Vào \"Trang chủ\" để xem gợi ý khoá học dành riêng cho bạn."),
            React.createElement("li", null, "Vào \"Thư viện\" để lọc và tìm kiếm khoá học theo nhu cầu."),
            React.createElement("li", null, "Nếu chưa tìm thấy khoá phù hợp, hãy \"Gửi yêu cầu học tập\" hoặc đăng ký hỗ trợ chi phí đào tạo.")
          )
        )
      ),
      React.createElement("div", { style: { display: "flex", justifyContent: "flex-end" } },
        React.createElement("button", { className: "glh-btn glh-btn--primary", onClick: onClose }, "Đã hiểu")
      )
    )
  );
}
