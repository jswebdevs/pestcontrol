# Graph Report - /home/jamil/Desktop/Projects/NodeJs/kamalvai/pestcontrolrajshahi  (2026-06-05)

## Corpus Check
- 5 files · ~45,677 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 570 nodes · 1220 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Public & Account Pages|Public & Account Pages]]
- [[_COMMUNITY_App Layouts & Routing|App Layouts & Routing]]
- [[_COMMUNITY_Users Backend Module|Users Backend Module]]
- [[_COMMUNITY_Admin Settings Editors|Admin Settings Editors]]
- [[_COMMUNITY_Backend Content Modules|Backend Content Modules]]
- [[_COMMUNITY_TipTap Rich Editor|TipTap Rich Editor]]
- [[_COMMUNITY_Auth DTOs|Auth DTOs]]
- [[_COMMUNITY_Backend Bootstrap|Backend Bootstrap]]
- [[_COMMUNITY_NestJS Package Metadata|NestJS Package Metadata]]
- [[_COMMUNITY_Service Editor UI|Service Editor UI]]
- [[_COMMUNITY_Auth & Contact Wiring|Auth & Contact Wiring]]
- [[_COMMUNITY_Backend Service Layer|Backend Service Layer]]
- [[_COMMUNITY_FAQs Admin Controller|FAQs Admin Controller]]
- [[_COMMUNITY_Media Picker UI|Media Picker UI]]
- [[_COMMUNITY_Testimonials Admin Controller|Testimonials Admin Controller]]
- [[_COMMUNITY_Auth Service|Auth Service]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Orders Service|Orders Service]]
- [[_COMMUNITY_Services Service|Services Service]]
- [[_COMMUNITY_Media Controller|Media Controller]]
- [[_COMMUNITY_Media Service|Media Service]]
- [[_COMMUNITY_Admin Orders Controller|Admin Orders Controller]]
- [[_COMMUNITY_OTP Controller|OTP Controller]]
- [[_COMMUNITY_Auth Strategies|Auth Strategies]]
- [[_COMMUNITY_Projects Service|Projects Service]]
- [[_COMMUNITY_Admin Settings Controller|Admin Settings Controller]]
- [[_COMMUNITY_Form UI Primitives|Form UI Primitives]]
- [[_COMMUNITY_Admin Projects Controller|Admin Projects Controller]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `ServiceEditor()` - 40 edges
2. `cn()` - 38 edges
3. `AuthController` - 28 edges
4. `AppModule` - 25 edges
5. `AuthService` - 24 edges
6. `UsersService` - 23 edges
7. `OrdersService` - 21 edges
8. `ServicesService` - 19 edges
9. `MediaController` - 18 edges
10. `PrismaService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Frontend README (Next.js)` --semantically_similar_to--> `Backend README (NestJS)`  [INFERRED] [semantically similar]
  pestcontrolrajshahi-frontend/README.md → pestcontrolrajshahi-backend/README.md
- `pestcontrol project` --conceptually_related_to--> `Frontend README (Next.js)`  [INFERRED]
  README.md → pestcontrolrajshahi-frontend/README.md
- `pestcontrol project` --conceptually_related_to--> `Backend README (NestJS)`  [INFERRED]
  README.md → pestcontrolrajshahi-backend/README.md
- `AdminLogin()` --calls--> `setAuthCookies()`  [EXTRACTED]
  pestcontrolrajshahi-frontend/src/app/admin/login/page.tsx → pestcontrolrajshahi-backend/src/modules/auth/auth.controller.ts
- `SheetFooter()` --calls--> `cn()`  [EXTRACTED]
  pestcontrolrajshahi-frontend/src/components/ui/sheet.tsx → pestcontrolrajshahi-frontend/src/lib/utils.ts

## Communities (34 total, 3 thin omitted)

### Community 0 - "Public & Account Pages"
Cohesion: 0.05
Nodes (58): AppConfig, envValidationSchema, AdminContactController, ContactDto, ContactModule, ContactService, PublicContactController, DashboardController (+50 more)

### Community 1 - "App Layouts & Routing"
Cohesion: 0.06
Nodes (25): JwtCustomerGuard, MailModule, MailService, MailTemplate, CreateOrderInput, OrderItemInput, OrdersService, OtpController (+17 more)

### Community 2 - "Users Backend Module"
Cohesion: 0.05
Nodes (11): FormValues, STATUSES, serverFetch(), schema, OrderItem, TIME_WINDOWS, PrivacyPage(), HomePage() (+3 more)

### Community 3 - "Admin Settings Editors"
Cohesion: 0.07
Nodes (30): AboutPage(), AccountLayout(), RootLayout(), getAdminSession(), getCustomerSession(), AdminLayout(), NAV, buildThemeCss() (+22 more)

### Community 4 - "Backend Content Modules"
Cohesion: 0.14
Nodes (11): AuthController, clearAuthCookies(), ForgotDto, ResetDto, setAuthCookies(), AuthService, IssueTokensInput, LoginDto (+3 more)

### Community 5 - "TipTap Rich Editor"
Cohesion: 0.08
Nodes (24): AboutEditor(), AboutSetting, BadgeSetting, BusinessInfo, BusinessInfoEditor(), CtaSetting, FinalCtaEditor(), FooterColumnsEditor() (+16 more)

### Community 6 - "Auth DTOs"
Cohesion: 0.13
Nodes (22): Backend pnpm-workspace.yaml, Kamil Mysliwiec (NestJS author), MIT License, NestJS framework, NestJS Devtools, NestJS Mau (AWS deploy), Node.js, pnpm (+14 more)

### Community 7 - "Backend Bootstrap"
Cohesion: 0.14
Nodes (16): MediaItem, MediaPicker(), MediaPickerProps, PickedMedia, SinglePickProps, DialogContent, DialogDescription, DialogFooter() (+8 more)

### Community 8 - "NestJS Package Metadata"
Cohesion: 0.15
Nodes (14): Hero(), Repeater(), RepeaterProps, SettingShell(), SettingShellProps, Button, ButtonProps, buttonVariants (+6 more)

### Community 9 - "Service Editor UI"
Cohesion: 0.22
Nodes (11): AuthModule, JwtUser, AcceptInviteDto, AdminInvitesController, CreateInviteDto, PublicInvitesController, InvitesModule, InvitesService (+3 more)

### Community 10 - "Auth & Contact Wiring"
Cohesion: 0.18
Nodes (10): Btn(), TiptapEditor(), cn(), Avatar, AvatarFallback, AvatarImage, Checkbox, Separator (+2 more)

### Community 11 - "Backend Service Layer"
Cohesion: 0.2
Nodes (13): ServiceCategory, ServiceEditor(), ServiceFormProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+5 more)

### Community 12 - "FAQs Admin Controller"
Cohesion: 0.16
Nodes (11): cld(), MediaPickerField(), About(), FinalCTA(), HowItWorks(), ServiceCards(), Testimonials(), TrustBadges() (+3 more)

### Community 13 - "Media Picker UI"
Cohesion: 0.15
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormLabel, FormMessage (+2 more)

### Community 14 - "Testimonials Admin Controller"
Cohesion: 0.21
Nodes (11): ColorRow(), Colors, DEFAULT_COLORS, FONTS, hexToHslString(), hslStringToHex(), hslToHex(), rgbToHslString() (+3 more)

### Community 15 - "Auth Service"
Cohesion: 0.36
Nodes (8): ALLOWED_MARKS, ALLOWED_NODES, escapeAttr(), escapeHtml(), renderMarksClose(), renderMarksOpen(), renderNode(), safeUrl()

### Community 16 - "Auth Controller"
Cohesion: 0.2
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 17 - "Orders Service"
Cohesion: 0.22
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 18 - "Services Service"
Cohesion: 0.31
Nodes (6): TagInput(), TagInputProps, Badge(), BadgeProps, badgeVariants, Input

### Community 19 - "Media Controller"
Cohesion: 0.29
Nodes (7): categories, docFromText(), main(), prisma, services, settings, theme

### Community 20 - "Media Service"
Cohesion: 0.39
Nodes (7): api, apiDelete(), apiGet(), apiPatch(), apiPost(), original, unwrap()

### Community 21 - "Admin Orders Controller"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 22 - "OTP Controller"
Cohesion: 0.25
Nodes (7): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableRow

### Community 23 - "Auth Strategies"
Cohesion: 0.47
Nodes (3): handler(), AllExceptionsFilter, bootstrap()

### Community 24 - "Projects Service"
Cohesion: 0.47
Nodes (6): pnpm build-script gate policy, dangerouslyAllowAllBuilds intentionally NOT set (pnpm 10+ conflict), pestcontrolrajshahi-backend/pnpm-workspace.yaml, onlyBuiltDependencies allowlist (in package.json), packages glob: ".", verifyDepsBeforeRun: false

### Community 25 - "Admin Settings Controller"
Cohesion: 0.4
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

## Knowledge Gaps
- **131 isolated node(s):** `schema`, `FormValues`, `OrderItem`, `TIME_WINDOWS`, `NAV` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminLogin()` connect `Backend Content Modules` to `App Layouts & Routing`, `Users Backend Module`?**
  _High betweenness centrality (0.314) - this node is a cross-community bridge._
- **Why does `AuthService` connect `Backend Content Modules` to `Public & Account Pages`, `App Layouts & Routing`, `Service Editor UI`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Backend Content Modules` to `Public & Account Pages`, `App Layouts & Routing`, `Service Editor UI`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **What connects `schema`, `FormValues`, `OrderItem` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public & Account Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `App Layouts & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Users Backend Module` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._