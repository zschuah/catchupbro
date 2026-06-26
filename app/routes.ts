import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("trip/:tripCode/join", "routes/join.tsx"),
  route("trip/:tripCode", "routes/dashboard.tsx"),
  route("trip/:tripCode/expense", "routes/expense.tsx"),
  route("trip/:tripCode/expense/:expenseId", "routes/edit-expense.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
