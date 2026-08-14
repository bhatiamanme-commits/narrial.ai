# 1. Purpose

## 1.1 Purpose of AGENT.md

`AGENT.md` is the master instruction and operating contract for every AI coding assistant working on the Narrial AI frontend.

This file defines how the AI must:

- Understand Narrial AI
- Interpret reference images
- Implement screens
- Build reusable components
- Apply the Narrial design system
- Implement interactions
- Connect screens
- Manage UI state
- Use mock data during Phase 1
- Prepare the frontend for real APIs in Phase 3
- Validate the implementation
- Protect the consistency and integrity of the product

`AGENT.md` is not only a visual design guide.

It defines how an AI assistant must transform a visual design into a **real, connected, interactive Narrial AI application**.

---

## 1.2 Core Purpose

The primary purpose of this file is to ensure that every screen generated from a reference image becomes a real part of the Narrial AI application rather than an isolated visual replica.

The AI must transform:

```text
Reference Image
        ↓
Visual Understanding
        ↓
Real Frontend Implementation
        ↓
Real Interaction
        ↓
Real Navigation
        ↓
Real State
        ↓
Screen Connectivity
        ↓
Mock Functionality
        ↓
API-Ready Frontend

# 2. What This File Controls

## 2.1 Global Frontend Control

`AGENT.md` is the permanent global control document for the Narrial AI frontend.

Every AI coding assistant working on Narrial AI must treat this file as the default operating contract for:

- Design
- Code structure
- Components
- Interactions
- Navigation
- State
- Screen connectivity
- Assets
- Responsive behavior
- Accessibility
- Performance
- Testing
- Validation
- Future API integration

The AI must read and follow this file whenever it creates, modifies, reviews, or validates any Narrial screen or frontend feature.

---

## 2.2 Visual Design Control

`AGENT.md` controls the global Narrial visual language.

This includes:

- Brand identity
- Brand colors
- Color hierarchy
- Color semantics
- Typography
- Font families
- Font weights
- Font sizes
- Icon language
- Icon sizes
- Icon behavior
- Layout
- Grid
- Spacing
- Border radius
- Borders
- Shadows
- Backgrounds
- Gradients
- Buttons
- Forms
- Cards
- Navigation
- Images
- Video presentation
- Animation
- Responsive behavior
- Accessibility presentation

The AI must use these rules when implementing every screen unless an approved screen-specific override exists.

---

## 2.3 Functional UI Control

`AGENT.md` controls how visual interface elements behave.

This includes:

- Buttons
- Links
- Navigation items
- Tabs
- Inputs
- Forms
- Selectors
- Checkboxes
- Radio controls
- Toggles
- Cards
- Menus
- Dropdowns
- Modals
- Drawers
- Upload controls
- Video controls
- Generation controls
- Editing controls
- Scheduling controls
- Publishing controls

Every visible interactive element must perform its intended action or use appropriate mock functionality during the UI-first phase.

A visually correct control that does nothing is considered incomplete unless the element is explicitly defined as non-interactive.

---

## 2.4 Screen Connectivity Control

`AGENT.md` controls how individual screens connect to the larger Narrial AI application.

Every implemented screen must be treated as part of an existing application rather than as an isolated design.

The AI must understand:

```text
Current Screen
      ↓
Interactive Element
      ↓
User Action
      ↓
Navigation / State Change / Operation
      ↓
Next Screen / Result / Feedback

# 3. Universal Screen Rule

## 3.1 Core Rule

Every reference image provided for Narrial AI represents a screen of the real Narrial AI application.

The AI must never treat a reference image as a static image to reproduce visually and nothing more.

The mandatory rule is:

> **Every reference image must be transformed into a real, interactive, connected, responsive, accessible, and maintainable application screen.**

---

## 3.2 Screen Is Not a Screenshot

A reference screenshot describes the visual appearance of a screen.

It does not represent the complete implementation.

The AI must transform:

```text
Reference Image
        ↓
Visual Structure
        ↓
Real Components
        ↓
Real Interaction
        ↓
Real State
        ↓
Real Navigation
        ↓
Application Connectivity
        ↓
Mock / Real Data
        ↓
Validated Screen

# 4. AI Agent Operating Principles

## 4.1 Core Principle

The AI coding agent must behave as an implementation agent working inside an existing product system.

The agent's responsibility is to:

- Understand the approved product requirements.
- Understand the global Narrial design system.
- Understand the current application state.
- Understand the provided screen specification.
- Understand the reference image.
- Implement the required screen.
- Connect it to the existing application.
- Preserve existing functionality.
- Validate the result.

The agent must not behave as an independent product designer who silently changes the product.

---

## 4.2 Understand Before Implementing

The AI must not begin coding immediately after receiving a reference image.

Before implementation, it must first understand:

```text
AGENT.md
    ↓
Existing Application
    ↓
Screen Specification
    ↓
Reference Image
    ↓
Existing Components
    ↓
Existing Routes
    ↓
Existing Assets
    ↓
Required Interactions
    ↓
Required States
    ↓
Implementation Plan

# 5. Source-of-Truth Hierarchy

## 5.1 Purpose

This section defines the order of authority that the AI coding agent must follow when implementing, modifying, reviewing, or validating any part of the Narrial AI frontend.

Narrial AI will use multiple sources during development, including:

- Product requirements
- `AGENT.md`
- Screen specifications
- Reference images
- Existing application code
- Existing components
- Existing routes
- Existing assets
- User instructions
- Implementation conventions

These sources may sometimes provide different levels of detail or appear to conflict.

The AI must therefore follow one consistent source-of-truth hierarchy.

The AI must never resolve important conflicts based only on personal preference or visual preference.

---

## 5.2 Primary Source-of-Truth Hierarchy

The AI must use the following priority order:

```text
1. Explicit Product Requirements
        ↓
2. Explicit Current User Instruction
        ↓
3. AGENT.md
        ↓
4. Approved Screen Specification
        ↓
5. Approved Existing Application Architecture
        ↓
6. Approved Reference Image
        ↓
7. Existing Reusable Components
        ↓
8. Technical / Implementation Best Practices
        ↓
9. AI Agent Preference


# 6. Existing Application Awareness

## 6.1 Purpose

The AI coding agent must treat the existing Narrial AI frontend as a living application rather than an empty project.

Before implementing, modifying, or connecting any screen, the agent must first understand the current state of the application.

The purpose of this rule is to ensure that every new implementation:

- Extends the existing application.
- Reuses existing work.
- Preserves approved functionality.
- Preserves existing navigation.
- Preserves existing design-system decisions.
- Avoids unnecessary duplication.
- Connects correctly with previously implemented screens.
- Remains compatible with future frontend and backend development.

The agent must never assume that the current task begins from zero.

---

## 6.2 Existing Application Is Context

The existing codebase is part of the implementation context.

Before making changes, the AI must inspect relevant existing:

```text
Routes
Screens
Components
Features
Hooks
Services
State
Mock Data
Assets
Fonts
Icons
Utilities
Configuration

# 7. Product Experience Philosophy

## 7.1 Purpose

The Product Experience Philosophy defines how Narrial AI should feel, behave, and communicate throughout the entire application.

The objective is not only to create attractive screens.

The objective is to create a product experience where:

```text
Complex AI System
        ↓
Simple Creator Experience


# 8. Visual Identity

## 8.1 Purpose

The Visual Identity defines the consistent visual character of Narrial AI across the entire application.

Every screen, component, interaction, illustration, image treatment, animation, and interface state must feel like it belongs to the same product.

The Visual Identity must communicate:

- Intelligence
- Creativity
- Automation
- Premium quality
- Modern technology
- Simplicity
- Confidence
- Speed
- Creator focus

The objective is not to make every screen look identical.

The objective is to make every screen feel unmistakably like Narrial AI.

---

## 8.2 Core Visual Identity Principle

> **Narrial AI should look technologically advanced without looking technically complicated.**

The interface should communicate:

```text
Advanced Technology
        +
Creative Intelligence
        +
Visual Simplicity
        +
Premium Product Quality

# 9. Color System

## 9.1 Purpose

The Color System defines the approved color language for the entire Narrial AI frontend.

Every screen, component, interaction, state, image treatment, background, button, icon, card, navigation element, form, video interface, and AI experience must use the approved Narrial color system.

The purpose is to ensure that:

- Every screen feels like Narrial AI.
- Important actions are immediately recognizable.
- Information has a consistent visual hierarchy.
- AI-related elements have a recognizable visual identity.
- Interactive states remain predictable.
- Accessibility and contrast are maintained.
- Screen-specific designs do not introduce uncontrolled colors.
- AI-generated reference screens are normalized into one coherent product system.

The AI must never invent arbitrary colors when an approved color token already exists.

---

## 9.2 Core Color Philosophy

Narrial AI uses a controlled visual foundation:

```text
BLACK
+
WHITE
+
ELECTRIC LIME

# 10. Color Theory

## 10.1 Purpose

Color Theory defines how Narrial AI uses its approved colors to communicate meaning, hierarchy, emotion, attention, interaction, and product identity.

The Color System defines **which colors are approved**.

Color Theory defines **why, where, when, and how those colors should be used**.

The AI must understand both systems before implementing any screen.

The purpose is to ensure that color decisions remain:

- Intentional
- Consistent
- Meaningful
- Accessible
- Emotionally appropriate
- Visually balanced
- Recognizable as Narrial AI

---

## 10.2 Core Color Theory Principle

> **Color must communicate purpose before decoration.**

Every meaningful color use should answer:

```text
Why is this color here?
What does this color communicate?
What should the user notice?
What action or state does it represent?
Does it support the Narrial visual identity?


# 11. Typography

## 11.1 Purpose

The Typography System defines how all text must appear and behave throughout the Narrial AI frontend.

Typography must provide:

- Clear visual hierarchy
- Fast comprehension
- Strong readability
- Consistent brand identity
- Reliable interaction
- Appropriate information density
- Premium visual quality
- Responsive behavior
- Accessibility

Typography is not only a visual styling system.

Typography also communicates:

```text
Importance
Hierarchy
Action
Status
Context
Brand Identity

# 12. Font Rules

## 12.1 Purpose

This section defines the rules for selecting, storing, loading, applying, replacing, and validating fonts throughout the Narrial AI frontend.

The objective is to ensure that typography remains:

- Consistent
- Predictable
- Readable
- Brand-aligned
- Responsive
- Accessible
- Performant
- Stable across screens and devices

The font system must prevent individual AI-generated reference images from introducing unrelated fonts into the Narrial application.

---

## 12.2 Core Font Principle

> **Narrial AI has one controlled typography foundation. A reference image may influence the visual appearance of typography, but it must not silently introduce a new font family.**

The AI must always prefer the approved Narrial font system over fonts inferred from a reference image.

---

## 12.3 Font Source of Truth

Font decisions must follow:

```text
Product Requirements
        ↓
Current Approved User Instruction
        ↓
AGENT.md
        ↓
Approved Font Files
        ↓
Screen Specification
        ↓
Reference Image

# 13. Icon System

## 13.1 Purpose

The Icon System defines the approved visual, semantic, functional, and implementation rules for icons throughout the Narrial AI frontend.

Icons are part of the product's interaction language.

They help users:

- Navigate
- Understand actions
- Recognize media
- Identify AI capabilities
- Understand system status
- Operate controls
- Move through workflows
- Quickly recognize familiar functions

The icon system must ensure that icons remain:

- Consistent
- Recognizable
- Accessible
- Scalable
- Responsive
- Visually aligned
- Semantically meaningful
- Easy for AI coding agents to reuse

---

## 13.2 Core Icon Principle

> **An icon must communicate a clear purpose and belong to one consistent Narrial visual language.**

The AI must never choose an icon simply because it looks attractive.

Every icon should have a reason to exist.

The preferred relationship is:

```text
Meaning
   ↓
Approved Icon
   ↓
Correct Context
   ↓
Correct Size
   ↓
Correct State
   ↓
Correct Accessibility

# 14. Icon Rules

## 14.1 Purpose

This section defines the implementation rules for using icons throughout the Narrial AI frontend.

Section 13 defines the Narrial Icon System.

This section defines how the AI agent must actually implement that system inside screens, components, navigation, media controls, forms, states, and interactions.

The objective is to ensure that every icon is:

- Correct
- Consistent
- Recognizable
- Accessible
- Functional where interactive
- Responsive
- Reusable
- Visually aligned with Narrial
- Easy for AI agents to implement consistently

---

## 14.2 Core Rule

> **Use the approved Narrial icon before creating or importing another icon.**

The AI must never select an icon based only on visual similarity to a reference image.

The AI must first identify:

```text
What does the icon mean?
        ↓
Does Narrial already have an approved icon?
        ↓
Reuse it.

# 15. Layout System

## 15.1 Purpose

The Layout System defines how content, components, screens, navigation, media, controls, whitespace, and interactive elements are positioned and organized throughout the Narrial AI frontend.

The objective is to ensure that every screen:

- Has a clear structure.
- Has predictable alignment.
- Maintains consistent spacing.
- Uses the approved grid and container system.
- Adapts correctly across devices.
- Preserves visual hierarchy.
- Supports real interaction.
- Remains easy for AI coding agents to understand and implement.
- Remains consistent with the existing Narrial application.

The Layout System controls **how the interface is organized**, not only how it looks in a reference image.

---

## 15.2 Core Layout Principle

> **Every Narrial screen must have intentional structure, hierarchy, spacing, and alignment.**

The AI must never reproduce a screenshot by placing unrelated elements at arbitrary coordinates.

The preferred layout model is:

```text
Screen
   ↓
Application Structure
   ↓
Layout Container
   ↓
Sections
   ↓
Components
   ↓
Content


# 16. Grid & Spacing Rules

## 16.1 Purpose

The Grid & Spacing System defines how distance, alignment, columns, rows, gaps, padding, margins, content density, and responsive spacing must be implemented throughout the Narrial AI frontend.

The objective is to ensure that:

- Every screen has consistent spacing.
- Related elements are visually grouped.
- Important elements receive appropriate breathing room.
- Repeated content aligns correctly.
- Screens remain responsive.
- Layouts remain stable when content changes.
- Reference images can be reproduced using a real spacing system.
- AI coding agents do not invent arbitrary spacing values.
- The same spacing language is maintained across the application.

The system controls both:

```text
GRID
+
SPACING

# 17. Border Radius

## 17.1 Purpose

The Border Radius System defines the approved corner-radius language for the entire Narrial AI frontend.

It controls the shape and visual softness of:

- Buttons
- Cards
- Inputs
- Images
- Video containers
- Modals
- Drawers
- Panels
- Navigation elements
- Badges
- Avatars
- AI components
- Interactive surfaces
- Feature containers

The objective is to ensure that Narrial AI uses one coherent shape language across all screens while allowing different component types to have appropriate levels of rounding.

---

## 17.2 Core Border Radius Principle

> **Border radius must create a consistent visual language, not random decoration.**

Every rounded corner must serve a structural or visual purpose.

The AI must not independently choose radius values simply because they appear attractive or because a reference image contains a different value.

---

## 17.3 Radius Philosophy

Narrial should use a:

```text
Modern
Soft
Clean
Controlled
Premium
Geometric


# 18. Border System

## 18.1 Purpose

The Border System defines how borders, dividers, outlines, separators, focus rings, selected states, input boundaries, cards, panels, media containers, and interactive surfaces must be implemented throughout the Narrial AI frontend.

The objective is to ensure that borders:

- Create clear visual structure.
- Separate related surfaces appropriately.
- Support hierarchy.
- Communicate interaction and state.
- Maintain the Narrial visual identity.
- Remain subtle and premium.
- Work across all screen sizes.
- Remain accessible.
- Stay consistent across every screen and component.
- Can be implemented predictably by AI coding agents.

Borders must support the design rather than become decorative noise.

---

## 18.2 Core Border Principle

> **Borders should define structure, separation, interaction, and state with the minimum visual weight necessary.**

The AI must not add borders simply because a component looks empty.

A border should have a clear purpose.

Typical purposes include:

```text
Structure
Separation
Focus
Selection
Interaction
Status
Input Boundaries
Media Boundaries
Grouping

# 19. Shadow System

## 19.1 Purpose

The Shadow System defines how shadows, elevation, depth, separation, glow, and visual layering must be implemented throughout the Narrial AI frontend.

The objective is to ensure that shadows:

- Create meaningful visual depth.
- Separate surfaces without excessive decoration.
- Establish hierarchy.
- Support interactive states.
- Work consistently with the dark Narrial environment.
- Remain subtle and premium.
- Do not compete with video, AI visuals, typography, or primary actions.
- Remain performant across supported devices.

Shadows must be treated as part of the visual hierarchy rather than as decoration.

---

## 19.2 Core Shadow Principle

> **Use the smallest shadow necessary to communicate depth, separation, elevation, or interaction.**

The AI must not add shadows simply because a component appears visually flat.

A shadow must have a purpose.

Typical purposes include:

```text
Depth
Elevation
Surface Separation
Floating UI
Modal / Drawer Separation
Interactive Emphasis
AI Glow
Media Separation

# 20. Background System

## 20.1 Purpose

The Background System defines how backgrounds, surfaces, overlays, image backgrounds, video backgrounds, gradients, AI effects, environmental layers, and visual depth must be implemented throughout the Narrial AI frontend.

The objective is to ensure that every screen uses backgrounds that:

- Support the content.
- Preserve readability.
- Maintain Narrial's visual identity.
- Establish visual hierarchy.
- Provide appropriate depth.
- Support interaction.
- Remain responsive.
- Remain accessible.
- Remain performant.
- Work consistently across the complete application.

The background system must support both ordinary application screens and specialized experiences such as:

- AI generation
- Video editing
- Video review
- Creative previews
- Campaign planning
- Analytics
- Authentication
- Onboarding
- Billing
- Autopilot

---

## 20.2 Core Background Principle

> **The background must support the user task without competing with the content.**

A background should create the environment in which the interface exists.

The preferred relationship is:

```text
Background
   ↓
Surface
   ↓
Content
   ↓
Interaction

# 21. Gradient Rules

## 21.1 Purpose

This section defines how gradients must be designed, selected, implemented, animated, and validated throughout the Narrial AI frontend.

Gradients are a supporting visual technique.

They may be used to create:

- Depth
- Focus
- Visual transition
- AI atmosphere
- Lighting
- Surface separation
- Media readability
- Brand emphasis

Gradients must never become the primary visual language of Narrial.

---

## 21.2 Core Gradient Principle

> **Gradients must have a purpose. They must support hierarchy, atmosphere, readability, or interaction without overpowering the interface.**

The AI must never add a gradient simply because:

```text
The screen looks empty.
The reference contains one.
The product is AI-powered.
The gradient looks more modern.

# 22. Image Rules

## 22.1 Purpose

The Image Rules define how all images must be selected, stored, loaded, displayed, transformed, optimized, and validated throughout the Narrial AI frontend.

Images are a major part of Narrial because the product depends heavily on:

- Reference videos and their thumbnails
- Generated video previews
- AI-generated characters
- Character selections
- Creative references
- Avatars
- Brand assets
- Illustrations
- Campaign visuals
- Social content previews
- AI-generated visual assets
- Empty-state illustrations
- Background imagery

The purpose of these rules is to ensure that every image:

- Serves a clear purpose.
- Preserves the intended visual quality.
- Uses the correct aspect ratio.
- Remains responsive.
- Loads efficiently.
- Remains accessible.
- Uses the correct crop and positioning.
- Fits the Narrial visual system.
- Does not unexpectedly break the layout.
- Remains replaceable when mock assets are replaced by real assets.

---

## 22.2 Core Image Principle

> **Images are content first and decoration second.**

Every image must have a defined purpose.

The AI must determine whether an image is:

```text
Content
Reference
Brand Asset
AI Output
Avatar
Thumbnail
Illustration
Background
Decorative Element
Temporary Asset

# 23. Video & Media Rules

## 23.1 Purpose

The Video & Media Rules define how video, audio, music, voice, media previews, thumbnails, scenes, timelines, playback controls, media states, media actions, and media-related interactions must be implemented throughout the Narrial AI frontend.

Video and media are core product elements in Narrial AI.

The media system must therefore support:

- Reference videos
- Uploaded videos
- Video URLs
- Generated videos
- Video scenes
- Characters
- Voice
- Music
- Audio
- Video thumbnails
- Video previews
- Video editing
- Scene regeneration
- Export
- Scheduling
- Publishing
- Media comparison
- Media processing
- Media loading
- Media failures

The objective is to ensure that media always feels like a natural, high-quality, interactive part of the Narrial AI product.

---

## 23.2 Core Media Principle

> **Media is primary product content, not decoration.**

When video or media is the purpose of a screen, the media must receive the appropriate visual priority.

The interface should support the media without unnecessarily competing with it.

The hierarchy should generally be:

```text
Media
  ↓
Primary Media Information
  ↓
Primary Media Action
  ↓
Supporting Metadata
  ↓
Secondary Actions

# 24. Button System

## 24.1 Purpose

The Button System defines the visual, functional, semantic, responsive, accessible, and interactive rules for every button throughout the Narrial AI frontend.

Buttons are one of the primary ways creators control Narrial.

The Button System must ensure that every button:

- Has a clear purpose.
- Communicates its importance.
- Performs its intended action.
- Uses consistent visual styling.
- Uses approved typography.
- Uses approved icons.
- Uses approved colors.
- Supports all required interaction states.
- Remains accessible.
- Remains responsive.
- Does not create accidental duplicate actions.
- Fits naturally into the complete Narrial user flow.

A button must never be treated as a decorative rectangle.

---

## 24.2 Core Button Principle

> **Every button must clearly communicate what will happen when the user activates it.**

The AI must think of a button as:

```text
Purpose
   ↓
Label
   ↓
Visual Hierarchy
   ↓
Interaction
   ↓
State
   ↓
Action
   ↓
Application Result

# 25. Form System

## 25.1 Purpose

The Form System defines how all forms, inputs, selections, validation, submission, editing, and user-provided information must be designed and implemented throughout the Narrial AI frontend.

Forms are a primary way creators communicate with Narrial.

They are used for:

- Authentication
- Onboarding
- Project creation
- Video input
- AI questions
- Creative strategy
- Character selection
- Voice selection
- Music selection
- Brand Memory
- Campaign planning
- Scheduling
- Social connections
- Billing
- Settings
- Search
- Filtering
- Editing
- Publishing
- AI configuration presented through creator-friendly controls

The objective is to make every form:

- Easy to understand
- Easy to complete
- Visually consistent
- Functionally real
- Accessible
- Responsive
- Validated
- Recoverable
- Connected to the application
- Ready for future API integration

---

## 25.2 Core Form Principle

> **Forms should ask the minimum information necessary to help the creator complete the current task.**

Every form should communicate:

```text
What is needed?
        ↓
Why is it needed?
        ↓
How should it be entered?
        ↓
Is it valid?
        ↓
What happens next?

# 25. Form System

## 25.1 Purpose

The Form System defines how all forms, inputs, selections, validation, submission, editing, and user-provided information must be designed and implemented throughout the Narrial AI frontend.

Forms are a primary way creators communicate with Narrial.

They are used for:

- Authentication
- Onboarding
- Project creation
- Video input
- AI questions
- Creative strategy
- Character selection
- Voice selection
- Music selection
- Brand Memory
- Campaign planning
- Scheduling
- Social connections
- Billing
- Settings
- Search
- Filtering
- Editing
- Publishing
- AI configuration presented through creator-friendly controls

The objective is to make every form:

- Easy to understand
- Easy to complete
- Visually consistent
- Functionally real
- Accessible
- Responsive
- Validated
- Recoverable
- Connected to the application
- Ready for future API integration

---

## 25.2 Core Form Principle

> **Forms should ask the minimum information necessary to help the creator complete the current task.**

Every form should communicate:

```text
What is needed?
        ↓
Why is it needed?
        ↓
How should it be entered?
        ↓
Is it valid?
        ↓
What happens next?

# 26. Card System

## 26.1 Purpose

The Card System defines how cards and card-like surfaces must be designed, structured, implemented, reused, and validated throughout the Narrial AI frontend.

Cards are one of the primary structures used to organize content in Narrial.

Cards may represent:

- Projects
- Videos
- Reference videos
- Generated videos
- Characters
- Voices
- Music
- Campaigns
- Analytics
- AI recommendations
- Brand settings
- Billing information
- Publishing information
- Notifications
- Settings groups
- Empty states
- Feature previews

The objective is to ensure that every Narrial card:

- Has a clear purpose.
- Uses the approved visual system.
- Has predictable structure.
- Supports the appropriate interaction.
- Handles real application states.
- Remains reusable.
- Remains responsive.
- Remains accessible.
- Works with dynamic content.
- Can transition from Phase 1 mock data to Phase 3 real data.

---

## 26.2 Core Card Principle

> **A card is a structured content unit, not merely a rounded rectangle.**

Every card must communicate:

```text
What is this?
        ↓
What information does it contain?
        ↓
What can the user do with it?
        ↓
What is its current state?

# 27. Navigation System

## 27.1 Purpose

The Navigation System defines how users move through the Narrial AI application.

Navigation must connect every screen into one coherent product experience and ensure that users always understand:

- Where they are.
- Where they can go.
- What they can do next.
- How to return.
- What section or workflow they are currently using.
- What context will be preserved when they move.
- What happens after an action or completed workflow.

Navigation is not only a visual element.

It is the structural connection between screens, features, workflows, state, and user intent.

---

## 27.2 Core Navigation Principle

> **Every navigation element must lead to a meaningful destination, state transition, or application action.**

The AI must never implement navigation only because a reference image contains a link, icon, tab, or button.

The required relationship is:

```text
Navigation Element
       ↓
User Interaction
       ↓
Approved Destination / State / Action
       ↓
Context Preserved
       ↓
Application Result

# 28. Component Architecture

## 28.1 Purpose

The Component Architecture defines how Narrial AI frontend components must be structured, organized, reused, composed, extended, tested, and connected to application functionality.

The objective is to build Narrial AI as one coherent frontend system rather than as a collection of independently coded screens.

The architecture must ensure that components are:

- Reusable
- Consistent
- Maintainable
- Type-safe
- Accessible
- Responsive
- Testable
- Functional
- Understandable by AI coding agents
- Compatible with Phase 1 mock functionality
- Ready for Phase 3 API integration

---

## 28.2 Core Component Principle

> **Build once, reuse many times, and create something new only when an existing component, variant, or composition cannot reasonably satisfy the requirement.**

The preferred architecture is:

```text
Design Tokens
      ↓
UI Primitives
      ↓
Composite Components
      ↓
Feature Components
      ↓
Feature Modules
      ↓
Screens
      ↓
Application Workflows

# 29. Component Reuse Rules

## 29.1 Purpose

The Component Reuse Rules define how the Narrial AI frontend must reuse, extend, compose, and maintain components across the entire application.

The objective is to prevent every screen from becoming an isolated implementation.

The AI must build Narrial as:

```text
One Product
   ↓
One Design System
   ↓
One Component System
   ↓
Many Screens
   ↓
Many Workflows

# 30. Interaction Rules

## 30.1 Purpose

The Interaction Rules define how every interactive element in the Narrial AI frontend must behave.

The objective is to ensure that users always receive:

- Clear feedback
- Predictable behavior
- Immediate response
- Visible state changes
- Safe actions
- Recoverable failures
- Consistent interaction patterns
- Accessible interaction
- Real application behavior

The interaction system applies to:

```text
Buttons
Cards
Inputs
Forms
Navigation
Tabs
Dropdowns
Toggles
Checkboxes
Radio Controls
Sliders
Video Controls
Editor Controls
Modals
Drawers
Menus
AI Controls
Generation Actions
Publishing Actions
Scheduling Actions


# 31. Hover / Focus / Active / Selected States

## 31.1 Purpose

This section defines how interactive components must visually and functionally respond to:

- Hover
- Focus
- Active / Pressed
- Selected

These states are part of the core Narrial interaction system.

They must make the interface feel:

- Responsive
- Predictable
- Clear
- Accessible
- Consistent
- Premium
- Connected to real application behavior

The AI must treat these states as part of the component implementation, not as optional decorative effects.

---

## 31.2 Core State Principle

> **Every interaction state must communicate a meaningful change without changing the identity of the component.**

The component should remain recognizable while communicating:

```text
Default
   ↓
Hover
   ↓
Focus
   ↓
Pressed / Active
   ↓
Selected

# 32. Loading States

## 32.1 Purpose

The Loading State System defines how Narrial AI must communicate waiting, retrieval, processing, generation, rendering, uploading, saving, publishing, and other temporary system activities.

Loading states must make the application feel:

- Responsive
- Honest
- Predictable
- Calm
- Informative
- Stable
- Professional
- Connected to real application activity

The purpose is not to make the interface appear busy.

The purpose is to clearly communicate:

```text
Something is happening
        ↓
What is happening?
        ↓
What can the user do while waiting?
        ↓
When can the user continue?

# 33. Empty States

## 33.1 Purpose

The Empty State System defines how Narrial AI must communicate situations where a screen, section, collection, feature, or workflow currently contains no content or no available data.

Empty states must help the creator understand:

- What is currently empty.
- Why it is empty.
- Whether the state is expected.
- What the user can do next.
- Whether the system is waiting for an action.
- Whether content can be created, uploaded, connected, or generated.
- Whether the empty state is temporary or permanent.

The objective is to ensure that empty screens never feel broken, unfinished, abandoned, or confusing.

---

## 33.2 Core Empty-State Principle

> **An empty state must explain the situation and provide the most useful next step.**

The basic structure is:

```text
Empty Condition
      ↓
Clear Explanation
      ↓
Useful Context
      ↓
Primary Next Action
      ↓
Optional Secondary Action

# 35. Success States

## 35.1 Purpose

The Success State System defines how Narrial AI must communicate when an action, operation, workflow, or background process has completed successfully.

Success states must give the creator clear confirmation that:

- The requested action completed.
- The application accepted the result.
- The resulting state is now available.
- The creator can confidently continue to the next step.

Success feedback must be:

- Clear
- Honest
- Immediate
- Proportional
- Consistent
- Accessible
- Non-disruptive
- Connected to actual application state

The AI must never use a success state merely because the user clicked a button.

---

## 35.2 Core Success Principle

> **Only communicate success when the intended operation has actually succeeded.**

The required relationship is:

```text
User Action
      ↓
Operation
      ↓
Actual Result
      ↓
Success Confirmed
      ↓
Success State
      ↓
Next Available Action

# 36. Animation & Motion Rules

## 36.1 Purpose

The Animation & Motion Rules define how movement, transitions, animation, micro-interactions, loading motion, AI motion, navigation transitions, media interactions, and state changes must be implemented throughout the Narrial AI frontend.

Motion must make the application feel:

- Responsive
- Intelligent
- Smooth
- Premium
- Fast
- Predictable
- Purposeful
- Calm

Motion must never make the application feel:

- Slow
- Distracting
- Game-like
- Random
- Excessively animated
- Artificially delayed
- Visually noisy

The objective is to make motion communicate meaning while preserving usability and performance.

---

## 36.2 Core Motion Principle

> **Every animation must have a purpose.**

Motion should communicate one or more of:

```text
Change
Relationship
Feedback
Progress
Status
Focus
Navigation
Hierarchy
AI Activity


# 37. Responsive Rules

## 37.1 Purpose

This section defines the mandatory responsive behavior for every Narrial AI screen, component, interaction, media element, and workflow.

The responsive system must ensure that Narrial AI remains:

* Visually consistent
* Usable
* Accessible
* Touch-friendly
* Keyboard-friendly
* Fast
* Stable
* Production-ready

across:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Responsive design must be implemented as part of the screen itself, not added later as a correction.

The AI must never treat responsive design as simply shrinking the desktop layout.

---

## 37.2 Core Responsive Principle

> **Narrial AI must preserve the same product experience while intelligently adapting its layout, density, navigation, controls, and interactions to the available space.**

The following must remain consistent:

```text
Brand Identity
Information Hierarchy
Core Actions
Navigation Logic
Interaction Meaning
Data Relationships
User Workflow
```

The following may adapt:

```text
Layout
Spacing
Columns
Navigation Presentation
Component Density
Typography Scale
Image Size
Control Arrangement
Panel Behavior
Content Order
```

---

## 37.3 Responsive Source of Truth

Responsive decisions must follow:

```text
Product Requirements
        ↓
Current Explicit User Instruction
        ↓
AGENT.md
        ↓
Existing Application Architecture
        ↓
Approved Design System
        ↓
Screen Specification
        ↓
Reference Design
```

The AI must not invent an unrelated mobile design language.

---

## 37.4 Supported Device Classes

Narrial AI must support:

```text
Small Mobile
Large Mobile
Tablet
Laptop
Desktop
Large Desktop
```

The implementation must respond to viewport size rather than being hardcoded around individual physical devices.

---

## 37.5 Breakpoint Philosophy

Breakpoints must represent meaningful changes in layout behavior.

A breakpoint should only be introduced when the current layout no longer provides a good experience.

Do not create breakpoints simply because:

```text
A screenshot has a different width.
A particular device has a different resolution.
The AI wants additional breakpoints.
A component looks slightly different.
```

---

## 37.6 Centralized Breakpoint System

The application must maintain centralized responsive breakpoints.

Recommended semantic categories:

```text
xs
sm
md
lg
xl
2xl
```

Exact values must be defined centrally in the project's design tokens or framework configuration.

The AI must not scatter arbitrary breakpoint values throughout individual screens.

---

## 37.7 Mobile-First Responsive Logic

Where practical, responsive components should follow:

```text
Mobile
   ↓
Tablet
   ↓
Laptop
   ↓
Desktop
   ↓
Large Desktop
```

However, complex Narrial workflows may require desktop-optimized layouts.

Desktop optimization must never result in an unusable mobile experience.

---

## 37.8 Responsive Layout Strategies

For every screen, the AI must explicitly determine which responsive strategy is appropriate:

```text
Fluid Scaling
Reflow
Stacking
Condensation
Collapse
Replacement
Reordering
Scrolling
Overflow
Navigation Transformation
```

The AI must select the simplest strategy that preserves usability.

---

## 37.9 Fluid Layout

Use fluid layouts where content can safely expand or contract.

Examples:

```text
Dashboard
Video Containers
Text Areas
Search Fields
Content Panels
Cards
```

Prefer:

```text
width: 100%
max-width
min-width
flex
grid
auto margins
responsive padding
```

over unnecessary fixed page dimensions.

---

## 37.10 Fixed Dimensions

Fixed dimensions are acceptable when they protect interaction quality or preserve a required visual ratio.

Examples:

```text
Icon Size
Touch Target
Button Height
Avatar
Video Aspect Ratio
Toolbar Control
```

Do not use fixed widths for entire application sections unless the product specifically requires them.

---

## 37.11 Container System

Narrial AI must use a centralized container system.

Conceptually:

```text
Viewport
┌──────────────────────────────────────────┐
│                                          │
│        Responsive Application Area       │
│                                          │
└──────────────────────────────────────────┘
```

Large screens must not stretch application content indefinitely.

Use:

```text
max-width
auto margins
responsive horizontal padding
```

where appropriate.

---

## 37.12 Page Padding

Page-level horizontal padding must adapt to viewport size.

Conceptually:

```text
Mobile
→ Compact

Tablet
→ Medium

Desktop
→ Larger

Large Desktop
→ Larger but bounded
```

Do not use one fixed page padding value across all devices.

---

## 37.13 Responsive Grid

Grid layouts must adapt to available space.

Example:

```text
Mobile
1 column

Tablet
2 columns

Laptop
2–3 columns

Desktop
3–4 columns

Large Desktop
4+ where appropriate
```

The exact number of columns must depend on content width and interaction requirements.

---

## 37.14 Grid Minimum Width

Grid items must maintain a usable minimum width.

When space becomes insufficient:

```text
Columns
   ↓
Reduce
   ↓
Stack
```

Do not create:

```text
Tiny Cards
Compressed Text
Broken Buttons
Unreadable Metadata
```

---

## 37.15 Content Priority

When viewport space decreases, content must be prioritized in this order:

```text
1. Primary Action
2. Current Task
3. Critical Status
4. Essential Information
5. Secondary Actions
6. Supporting Information
7. Decorative Content
```

Low-priority content may be:

```text
Collapsed
Moved
Replaced
Hidden
```

but essential functionality must remain accessible.

---

## 37.16 Responsive Reordering

Content may change order when required.

Example:

```text
Desktop:
Video | Metadata | Actions

Mobile:
Video
Actions
Metadata
```

The mobile order must follow the user's task priority.

---

## 37.17 Responsive Replacement

A desktop component may be replaced by a more suitable mobile interaction.

Example:

```text
Desktop:
Sidebar Filters

Mobile:
Filter Button
      ↓
Bottom Sheet
```

Replacement is preferred over forcing a complex desktop component into a narrow viewport.

---

## 37.18 Navigation Responsiveness

Desktop may use:

```text
Sidebar
Top Navigation
Workspace Navigation
```

Mobile may use:

```text
Compact Header
Menu Drawer
Bottom Navigation
Bottom Sheet
```

The navigation logic must remain consistent even when its presentation changes.

---

## 37.19 Sidebar Behavior

Desktop sidebar may support:

```text
Expanded
Collapsed
```

Mobile sidebar should normally be:

```text
Hidden
   ↓
Menu / Drawer
   ↓
Temporarily Expanded
```

Do not keep a large permanent sidebar on narrow screens.

---

## 37.20 Header Responsiveness

Desktop headers may contain:

```text
Logo
Navigation
Search
Credits
Notifications
Profile
Primary Action
```

Mobile headers should prioritize:

```text
Menu
Logo
Current Context
Primary Action / Profile
```

Secondary controls may move into menus.

---

## 37.21 Navigation Priority

When space is limited:

```text
Primary
   ↓
Secondary
   ↓
Utility
   ↓
Optional
```

Primary navigation must remain accessible before utility controls.

---

## 37.22 Mobile Navigation

Mobile navigation must be deliberately designed for touch.

It must not simply be a compressed desktop sidebar.

Frequently used destinations may use bottom navigation.

Secondary destinations may use a menu drawer.

---

## 37.23 Bottom Navigation

Bottom navigation should contain only the highest-priority destinations.

Do not place every Narrial feature inside bottom navigation.

The user must be able to identify:

```text
Current Location
Available Destinations
Primary Navigation
```

quickly.

---

## 37.24 Touch Targets

Interactive elements must have sufficiently large touch areas.

The visible icon may remain small, but its interactive container must be easy to tap.

Avoid tiny mobile controls.

---

## 37.25 Hover Independence

Important functionality must never depend on hover.

Any desktop hover behavior must have an equivalent touch interaction.

Example:

```text
Desktop:
Hover → Action

Mobile:
Tap / Visible Action / Menu
```

The AI must never implement:

```text
Hover → Important Information
Mobile → No Alternative
```

---

## 37.26 Hover-to-Touch Transformation

When a desktop interaction uses hover:

```text
Identify Hover Behavior
        ↓
Determine Its Purpose
        ↓
Create Touch Equivalent
        ↓
Preserve Same Meaning
```

Possible alternatives:

```text
Tap
Long Press
Visible Action
Context Menu
Bottom Sheet
```

---

## 37.27 Typography Responsiveness

Typography must preserve hierarchy across devices.

Hierarchy:

```text
Page Title
Section Title
Card Title
Body
Secondary
Metadata
```

Do not aggressively shrink typography just to fit more information.

---

## 37.28 Responsive Typography Scaling

Typography may use:

```text
Design Tokens
Fluid Scaling
Breakpoint Variants
```

depending on the component.

Large display text may scale more than body text.

Body text must remain comfortably readable.

---

## 37.29 Text Wrapping

Text must wrap naturally unless there is a documented reason not to.

Avoid unnecessary:

```text
nowrap
overflow: hidden
text clipping
```

for user-facing content.

Test with:

```text
Long User Names
Long Project Names
Long Button Labels
Translated Text
Long Error Messages
```

---

## 37.30 Line Length

Desktop text should not become excessively wide.

Mobile text should not become unnecessarily narrow.

Readable line length must be maintained through appropriate containers and spacing.

---

## 37.31 Button Responsiveness

Buttons must remain easy to understand and interact with.

Desktop:

```text
[ Create Video ]
```

Mobile may use:

```text
[ Create Video ]
```

with a larger available width where appropriate.

Primary actions must remain visually dominant.

---

## 37.32 Button Group Responsiveness

Desktop:

```text
[ Save ] [ Cancel ]
```

Mobile may use:

```text
[ Save ]
[ Cancel ]
```

or:

```text
[ Save ] [ Cancel ]
```

depending on available space.

The primary action must remain obvious.

---

## 37.33 Form Responsiveness

Multi-column forms should become stacked when the available width is insufficient.

Desktop:

```text
First Name     Last Name

Email          Phone
```

Mobile:

```text
First Name

Last Name

Email

Phone
```

The form must remain easy to scan and complete.

---

## 37.34 Form Labels

Do not remove labels simply to save space.

Placeholders must not become the only source of field meaning when persistent labels are required.

---

## 37.35 Form Error Responsiveness

Validation messages must remain fully visible on small screens.

Never:

```text
Clip Error
Hide Error
Overflow Error
Overlap Error
```

The user must always be able to understand what needs correction.

---

## 37.36 Card Responsiveness

Cards may adapt:

```text
Width
Height
Spacing
Content Density
Layout Direction
Action Placement
```

Example:

```text
Desktop:
Thumbnail | Content | Actions

Mobile:
Thumbnail
Content
Actions
```

---

## 37.37 Video Card Responsiveness

Generated video cards must preserve:

```text
9:16
```

vertical video proportions.

Never distort generated videos to fit a responsive container.

---

## 37.38 Video Grid Responsiveness

Recommended starting behavior:

```text
Mobile
1 column

Tablet
2 columns

Desktop
3+ columns
```

The exact layout must depend on:

```text
Video Width
Metadata Density
Screen Width
Interaction Requirements
```

---

## 37.39 Video Review Responsiveness

Desktop:

```text
Video
+
Metadata
+
Actions
```

Mobile:

```text
Video
↓
Metadata
↓
Actions
```

The primary action must remain easy to access.

---

## 37.40 Video Player Responsiveness

The video player must:

* Preserve aspect ratio.
* Never overflow its container.
* Adapt to available width.
* Support touch controls.
* Support appropriate portrait and landscape behavior.
* Avoid unnecessarily loading large media on small screens.

---

## 37.41 Video Editor Responsiveness

The editor is a specialized responsive experience.

Desktop may use:

```text
┌──────────┬───────────────────┬──────────┐
│ Assets   │ Video Preview     │ Controls │
├──────────┴───────────────────┴──────────┤
│ Timeline                                 │
└──────────────────────────────────────────┘
```

Mobile may use:

```text
Video Preview
      ↓
Active Tool
      ↓
Bottom Sheet / Panel
      ↓
Timeline / Scene Controls
```

Do not attempt to fit the entire desktop editor into a narrow mobile viewport.

---

## 37.42 Campaign Planner Responsiveness

Desktop may show:

```text
MON TUE WED THU FRI SAT SUN
```

with multiple content cards.

Mobile may use:

```text
Date
  ↓
Scheduled Content
  ↓
Next Date
```

or an intentional horizontally scrollable calendar.

The creator must still be able to:

```text
Review
Reorder
Reschedule
Approve
Replace
```

content.

---

## 37.43 Analytics Responsiveness

Desktop may display:

```text
Charts
Metrics
Tables
Filters
```

Mobile should prioritize:

```text
Key Metrics
      ↓
Important Insights
      ↓
Charts
      ↓
Detailed Data
```

Wide tables may use horizontal scrolling or responsive alternatives.

---

## 37.44 Tables

Complex tables must not be forced into tiny mobile columns.

Use an appropriate strategy:

```text
Horizontal Scroll
Responsive Cards
Column Prioritization
Expandable Rows
```

Critical information must remain accessible.

---

## 37.45 Modal Responsiveness

Desktop:

```text
Centered
Constrained Width
```

Mobile may become:

```text
Near Full Width
Bottom Sheet
Full-Screen Modal
```

depending on the complexity of the task.

---

## 37.46 Modal Width

Desktop modals should have an appropriate maximum width.

Do not create full-screen desktop modals without a documented reason.

---

## 37.47 Bottom Sheet Responsiveness

Bottom sheets are appropriate for mobile:

```text
Filters
Context Actions
Editing Options
Secondary Controls
Selection
```

They must be:

```text
Scrollable
Dismissible
Touch-Friendly
Accessible
```

---

## 37.48 Dropdown Responsiveness

Desktop may use:

```text
Dropdown
```

Mobile may use:

```text
Bottom Sheet
Full-Screen Selection
Native Select
```

when the desktop dropdown would be difficult to operate on touch.

---

## 37.49 Search Responsiveness

Desktop may show:

```text
[ Search projects... ]
```

Mobile may show:

```text
[ Search ]
```

that expands into a full search interface.

Search must remain discoverable.

---

## 37.50 Filter Responsiveness

Desktop:

```text
Date | Platform | Campaign | Status
```

Mobile:

```text
[ Filters ]
```

opens a bottom sheet or dedicated filter screen.

---

## 37.51 Horizontal Scrolling

Horizontal scrolling may be used intentionally for:

```text
Calendar
Tabs
Media Categories
Wide Tables
Timeline
```

It must not be used to compensate for a broken responsive layout.

---

## 37.52 Horizontal Overflow

No page may have accidental horizontal overflow.

The AI must validate:

```text
Viewport Width
+
Content Width
+
Padding
+
Margins
+
Borders
```

and ensure the page remains stable.

---

## 37.53 Intentional Overflow

When horizontal scrolling is intentional, the interface should provide enough visual context that users understand more content exists.

---

## 37.54 Image Responsiveness

Images must:

* Scale proportionally.
* Preserve intended aspect ratio.
* Avoid distortion.
* Use responsive sizing.
* Load appropriate resolutions.
* Avoid unnecessary full-resolution loading on mobile.

---

## 37.55 Image Cropping

Responsive cropping must preserve important visual information.

Pay particular attention to:

```text
Faces
Products
Text
Logos
Primary Subjects
```

Use appropriate positioning rather than arbitrary cropping.

---

## 37.56 Icon Responsiveness

Icons must remain visually balanced at every viewport.

Do not reduce icons below practical usability simply to save space.

The icon's touch container may be larger than its visual glyph.

---

## 37.57 Background Responsiveness

Backgrounds may adapt through:

```text
Scale
Position
Crop
Simplification
Removal
```

on smaller screens.

Background decoration must never reduce content readability.

---

## 37.58 Decorative Content

Low-priority decoration may be reduced or removed on smaller screens:

```text
Large Illustrations
Decorative Glows
Background Patterns
Secondary Ornament
```

Never remove:

```text
Primary Action
Critical Status
Navigation
Important Information
```

without an alternative.

---

## 37.59 AI Generation Screen Responsiveness

The AI generation screen must prioritize:

```text
Current Stage
Progress
Generated Result
Primary Action
```

Mobile should generally prioritize:

```text
Progress
   ↓
Current Stage
   ↓
Result
   ↓
Actions
```

Technical details may move into expandable sections.

---

## 37.60 AI Progress Responsiveness

Desktop may show:

```text
Stage List
Progress
Technical Details
Preview
```

Mobile should prioritize:

```text
Current Stage
Progress
Relevant Status
```

Technical information may be collapsed.

---

## 37.61 AI Controls Responsiveness

Multiple desktop controls should become logically grouped or stacked on mobile.

Do not create tiny controls merely to preserve desktop alignment.

---

## 37.62 Brand Memory Responsiveness

Desktop:

```text
Sidebar
+
Configuration Panel
```

Mobile:

```text
Sections
Accordion
Stacked Panels
```

All important brand settings must remain accessible.

---

## 37.63 Onboarding Responsiveness

Onboarding should be optimized for small screens.

Prioritize:

```text
Question
Context
Input
Primary Action
Progress
```

Avoid unnecessary secondary controls.

---

## 37.64 Welcome Screen Responsiveness

The welcome screen must preserve:

```text
Brand Identity
Primary Message
Primary Action
Visual Hierarchy
```

across all supported screen sizes.

The AI must not simply scale the desktop screen down.

---

## 37.65 Mobile Welcome Screen

Mobile should generally prioritize:

```text
Brand
   ↓
Headline
   ↓
Supporting Text
   ↓
Primary Action
   ↓
Secondary Action
```

The screen must remain visually balanced without unnecessary scrolling.

---

## 37.66 Desktop Welcome Screen

Desktop may provide:

```text
Large Visual Area
Hero Typography
Primary CTA
Supporting Visuals
```

while preserving the same product identity.

---

## 37.67 Orientation

Where relevant, Narrial must support:

```text
Portrait
Landscape
```

Video experiences require particular attention because Narrial primarily produces vertical 9:16 content.

---

## 37.68 Portrait Priority

Mobile portrait should be the default assumption for creator workflows unless the feature genuinely requires landscape.

---

## 37.69 Landscape Handling

Landscape may provide additional room for:

```text
Video Editing
Analytics
Complex Tables
Multi-Panel Interfaces
```

The layout may expand accordingly.

---

## 37.70 Safe Areas

Mobile interfaces must account for device safe areas.

Important controls must not be placed beneath:

```text
Notches
System Indicators
Home Indicators
Rounded Screen Corners
```

---

## 37.71 Mobile Keyboard

When the mobile keyboard appears:

```text
Input
   ↓
Keyboard
   ↓
Viewport Changes
```

the active input must remain visible.

The application must not leave the user typing into an obscured field.

---

## 37.72 Keyboard and Sticky Actions

Fixed bottom actions must adapt when the keyboard is open.

Avoid:

```text
Keyboard
+
Sticky CTA
+
Input
```

overlapping one another.

---

## 37.73 Fixed Elements

Fixed headers, footers, floating actions, and navigation must be tested at every supported viewport.

They must not cover:

```text
Content
Inputs
Video Controls
Primary Actions
Error Messages
```

---

## 37.74 Sticky Elements

Sticky elements should be used only when they provide meaningful utility.

Examples:

```text
Editor Toolbar
Campaign Header
Primary Action Bar
```

Do not make every section sticky.

---

## 37.75 Responsive Density

Desktop may support:

```text
Higher Information Density
```

Mobile should generally use:

```text
Focused Information Density
```

The AI must prioritize information instead of simply shrinking every element.

---

## 37.76 Responsive State Preservation

Changing viewport size must not unexpectedly reset:

```text
Selected Tab
Open Project
Generation State
Form Data
Video Position
Filters
```

Responsive layout changes must preserve application state.

---

## 37.77 Responsive Navigation State

When a desktop sidebar collapses or a viewport changes, navigation context must remain intact.

Do not reset the user's location.

---

## 37.78 Responsive Modal State

An open modal must remain usable when the viewport changes.

The modal should adapt its presentation rather than lose its state.

---

## 37.79 Responsive Form State

Changing orientation or viewport must never clear user-entered form data.

---

## 37.80 Responsive Media Loading

The application should load media appropriate to the current viewport and task.

Avoid loading unnecessarily large assets on mobile.

---

## 37.81 Responsive Performance

Mobile performance must receive explicit attention.

Validate:

```text
Initial Load
Navigation
Video Thumbnail Loading
Scrolling
Animations
Generation Updates
Large Lists
Editor Interactions
```

Avoid unnecessary:

```text
JavaScript
Images
Video Data
Animations
Network Requests
```

---

## 37.82 Responsive Accessibility

Responsive layouts must preserve:

```text
Keyboard Access
Touch Access
Focus Visibility
Readable Text
Accessible Labels
Screen Reader Structure
Color Contrast
```

Responsive transformations must not create inaccessible controls.

---

## 37.83 Responsive Testing Matrix

Every major screen must be tested at representative viewport categories:

```text
Small Mobile
Large Mobile
Tablet Portrait
Tablet Landscape
Laptop
Desktop
Large Desktop
```

Exact test dimensions must be maintained centrally in the project's QA configuration.

---

## 37.84 Critical Workflow Testing

Responsive testing must cover:

```text
Authentication
Onboarding
Create Project
Upload Video
Submit Video URL
Generation
Video Review
Video Editing
Campaign Planning
Publishing
Analytics
Billing
```

A screen is not considered responsive-ready if its primary workflow fails on a supported viewport.

---

## 37.85 Responsive Visual Validation

The AI must validate the implementation against the reference at the intended viewport.

Validate:

```text
Spacing
Alignment
Typography
Component Size
Image Scale
Navigation
Content Priority
CTA Placement
```

Desktop accuracy does not automatically mean responsive accuracy.

---

## 37.86 Reference Image Responsive Interpretation

When only a desktop reference exists:

```text
Reference
      ↓
Identify Visual Tokens
      ↓
Identify Layout Relationships
      ↓
Identify Content Priority
      ↓
Apply Responsive Rules
      ↓
Adapt Mobile / Tablet
```

The AI must preserve the visual intent without forcing exact desktop geometry onto smaller screens.

---

## 37.87 Reference Image vs Responsive Behavior

The reference image defines:

```text
Visual Intent
```

The responsive system defines:

```text
Behavior Across Viewports
```

When exact geometry cannot fit on a smaller screen, preserve:

```text
Hierarchy
Brand
Meaning
Interaction
Visual Relationships
```

rather than the exact dimensions.

---

## 37.88 Screen-Specific Responsive Overrides

A screen may have specialized responsive behavior when:

* The workflow genuinely requires it.
* The interaction model changes substantially.
* Content density requires restructuring.
* Usability improves.
* The global design system remains respected.

Potential examples:

```text
Video Editor
Campaign Planner
Analytics Dashboard
Generation Workspace
```

---

## 37.89 Responsive Override Documentation

Every screen-specific override must document:

```text
Screen
Reason
Affected Breakpoint
Layout Change
Interaction Change
Hidden / Moved Content
Replacement Component
Accessibility Considerations
```

---

## 37.90 Responsive Anti-Patterns

The AI must never implement:

```text
Fixed desktop width on mobile
Tiny buttons
Tiny text
Accidental horizontal overflow
Permanent desktop sidebar on mobile
Hover-only functionality
Hidden primary actions
Distorted video
Broken modals
Overlapping sticky controls
Unscrollable content
Unreadable tables
Clipped errors
Excessive breakpoint overrides
Device-specific hardcoded layouts
Desktop screenshot shrinking
```

---

## 37.91 Responsive Quality Gate

Before approving any screen:

```text
[ ] Mobile layout works
[ ] Tablet layout works
[ ] Laptop layout works
[ ] Desktop layout works
[ ] Large desktop layout works
[ ] Portrait behavior works
[ ] Landscape behavior works where relevant
[ ] No accidental horizontal overflow
[ ] Primary action remains accessible
[ ] Navigation remains usable
[ ] Touch targets are usable
[ ] Hover is not required
[ ] Focus remains visible
[ ] Typography remains readable
[ ] Forms remain usable
[ ] Error messages remain visible
[ ] Modals remain usable
[ ] Drawers remain usable
[ ] Tables have a responsive strategy
[ ] Video maintains correct aspect ratio
[ ] Images maintain correct proportions
[ ] Fixed elements do not cover content
[ ] Mobile keyboard behavior works
[ ] Safe areas are considered
[ ] Responsive state is preserved
[ ] Media loading is appropriate
[ ] Performance is acceptable
[ ] Accessibility remains intact
[ ] Reference visual intent is preserved
[ ] Responsive transformation is intentional
[ ] Screen-specific override is documented
```

---

## 37.92 Final Responsive Principle

> **Narrial AI must not become a smaller desktop application on mobile. It must become the same product intelligently adapted to the available space, interaction method, and user priorities.**

The responsive model is:

```text
AVAILABLE SPACE
      ↓
CONTENT PRIORITY
      ↓
LAYOUT DECISION
      ↓
COMPONENT ADAPTATION
      ↓
INTERACTION ADAPTATION
      ↓
VISUAL VALIDATION
      ↓
ACCESSIBILITY + PERFORMANCE
```

For every screen:

```text
Desktop
   ↓
Tablet
   ↓
Mobile
```

must preserve:

```text
Product Meaning
User Goal
Core Workflow
Brand Identity
Interaction Logic
```

while adapting:

```text
Layout
Density
Navigation
Spacing
Component Arrangement
Control Presentation
Media Size
```

**The AI must always design responsive behavior as part of the screen implementation itself—not as a separate correction after the desktop screen is finished.**


# 38. Accessibility Rules

## 38.1 Purpose

This section defines the mandatory accessibility rules for every Narrial AI screen, component, interaction, workflow, and user-facing experience.

Accessibility must be treated as a core product requirement, not as a final polishing step.

Narrial AI must remain usable for people with different:

```text
Vision
Hearing
Motor Ability
Cognitive Ability
Input Methods
Device Types
Screen Sizes
```

The AI must implement accessibility from the beginning of every screen.

---

## 38.2 Core Accessibility Principle

> **Every important Narrial AI action, piece of information, and workflow must remain understandable and usable without relying on a single sensory ability or interaction method.**

The interface must not depend exclusively on:

```text
Color
Hover
Sound
Animation
Mouse
Touch
Vision
```

when an equivalent accessible method is required.

---

## 38.3 Accessibility Source of Truth

Accessibility decisions must follow:

```text
Current Explicit User Instruction
        ↓
AGENT.md
        ↓
Approved Design System
        ↓
Screen Specification
        ↓
Responsive Rules
        ↓
Reference Design
```

If a reference image contains an inaccessible design pattern, the AI must preserve the visual intent while implementing an accessible equivalent.

---

## 38.4 Accessibility Standard

Narrial AI should target:

```text
WCAG 2.2 AA
```

for the web application unless a project-specific requirement defines a stricter standard.

Accessibility implementation must cover:

```text
Perceivable
Operable
Understandable
Robust
```

---

## 38.5 Semantic HTML

The AI must use semantic HTML wherever possible.

Prefer:

```text
button
a
nav
main
header
footer
section
article
form
label
input
textarea
select
```

over generic:

```text
div
span
```

for interactive or structural elements.

Do not recreate native browser behavior unnecessarily.

---

## 38.6 Interactive Element Rule

If an element performs an action, it must be implemented as an appropriate interactive control.

Prefer:

```text
<button>
<a>
<input>
<select>
<textarea>
```

instead of clickable containers.

Forbidden pattern:

```text
<div onClick={...}>
```

when a native button or link is appropriate.

---

## 38.7 Keyboard Accessibility

All important functionality must be usable with a keyboard.

Users must be able to:

```text
Navigate
Select
Open
Close
Submit
Cancel
Expand
Collapse
Move
Edit
Delete
```

without requiring a mouse.

---

## 38.8 Keyboard Navigation Order

Keyboard focus must follow a logical visual and task order.

Example:

```text
Header
   ↓
Primary Navigation
   ↓
Main Content
   ↓
Primary Action
   ↓
Secondary Actions
```

Do not create confusing focus jumps.

---

## 38.9 Tab Navigation

Interactive elements must be reachable using the keyboard.

Do not use positive `tabindex` values unnecessarily.

Prefer the natural document order.

---

## 38.10 Focus Visibility

Keyboard focus must always be visually distinguishable.

Never remove focus indicators without providing an equally visible accessible replacement.

Avoid:

```text
outline: none;
```

without an appropriate replacement.

---

## 38.11 Focus Contrast

Focus indicators must have sufficient visual distinction from surrounding UI.

Focus states must remain visible across:

```text
Light Backgrounds
Dark Backgrounds
Cards
Buttons
Inputs
Images
Gradients
```

---

## 38.12 Focus Management

Interactive overlays must manage focus correctly.

When opening:

```text
Modal
Dialog
Drawer
Menu
Bottom Sheet
```

focus should move appropriately into the active interface.

When closing, focus should return to the element that initiated the interaction where appropriate.

---

## 38.13 Modal Accessibility

Modals must:

* Have an accessible name.
* Clearly communicate their purpose.
* Trap focus appropriately when required.
* Allow keyboard dismissal where appropriate.
* Prevent interaction with inaccessible background content.
* Return focus after closing.

Do not create visually styled containers that behave like dialogs without appropriate semantics.

---

## 38.14 Dialog Accessibility

Dialogs must provide:

```text
Title
Purpose
Primary Action
Secondary / Cancel Action
Close Mechanism
```

The user must understand what decision is being requested.

---

## 38.15 Drawer Accessibility

Drawers must:

```text
Open Predictably
Receive Appropriate Focus
Be Keyboard Accessible
Be Dismissible
Return Focus
```

On mobile, drawers must also be touch-friendly.

---

## 38.16 Bottom Sheet Accessibility

Bottom sheets must provide:

```text
Accessible Name
Clear Purpose
Dismiss Action
Keyboard Access
Touch Access
Scrollable Content
```

Do not make important controls unreachable because the sheet is partially visible.

---

## 38.17 Escape Key

Where appropriate, the `Escape` key should close:

```text
Modal
Dialog
Drawer
Dropdown
Menu
Bottom Sheet
```

Do not use Escape to close a component if doing so could cause destructive or unexpected behavior without appropriate confirmation.

---

## 38.18 Screen Reader Support

Important content must be understandable to screen-reader users.

Provide appropriate:

```text
Labels
Headings
Landmarks
Descriptions
Roles
States
Relationships
```

Do not rely only on visual positioning.

---

## 38.19 Page Landmarks

Major application areas should use meaningful landmarks such as:

```text
header
nav
main
aside
footer
```

The user should be able to understand the overall page structure through assistive technology.

---

## 38.20 Heading Hierarchy

Headings must follow a logical hierarchy.

Example:

```text
H1
 ├── H2
 │    ├── H3
 │    └── H3
 └── H2
```

Do not choose heading levels purely because a heading visually looks larger or smaller.

Visual size must be controlled through styling.

---

## 38.21 One Primary Page Heading

Major application screens should generally have one clear primary heading.

The heading should communicate the purpose of the screen.

---

## 38.22 Accessible Names

Every interactive control must have a meaningful accessible name.

Examples:

```text
Create project
Play video
Pause video
Open filters
Close dialog
Delete project
Connect YouTube
```

Avoid ambiguous labels such as:

```text
Click here
More
Action
Button
```

unless additional accessible context makes the meaning clear.

---

## 38.23 Icon-Only Buttons

Icon-only controls must have an accessible label.

Example:

```text
Visual:
[ 🔍 ]

Accessible meaning:
Search
```

Do not rely on the icon alone.

---

## 38.24 Icon Buttons

Icon buttons must provide:

```text
Accessible Name
Visible Focus
Sufficient Touch Area
Clear State
```

Tooltips may supplement an icon but must not be the only accessible name.

---

## 38.25 Tooltip Accessibility

Tooltips must not contain essential information that is inaccessible through another method.

Tooltips should work with:

```text
Hover
Keyboard Focus
Touch where appropriate
```

---

## 38.26 Color Accessibility

Color must never be the only method of communicating meaning.

Forbidden:

```text
Green = Success
Red = Failure
Yellow = Warning
```

without another indicator.

Use combinations such as:

```text
Color
+
Icon
+
Text
```

where appropriate.

---

## 38.27 Status Accessibility

Generation status must be understandable without relying only on color.

Example:

```text
✓ Completed
! Attention Required
× Failed
Processing
```

Color may reinforce the meaning but must not be the only signal.

---

## 38.28 Error Accessibility

Errors must be:

```text
Visible
Understandable
Associated With the Relevant Control
Announced When Appropriate
Recoverable
```

Avoid exposing technical implementation errors directly to users.

---

## 38.29 Form Labels

Every form control must have an accessible label.

Labels should remain meaningful even when:

```text
Placeholder Disappears
User Enters Text
Validation Appears
Screen Is Resized
```

---

## 38.30 Placeholder Rule

Placeholders must not replace persistent labels when the field's purpose would otherwise become unclear.

Placeholder text should be treated as supporting information.

---

## 38.31 Required Fields

Required fields must be clearly communicated.

Do not rely only on:

```text
Red Border
Asterisk
Color
```

where additional explanation is necessary.

---

## 38.32 Form Validation

Validation must communicate:

```text
What Is Wrong
Where It Is Wrong
How To Fix It
```

Example:

```text
Email address

Please enter a valid email address.
```

Do not use vague messages such as:

```text
Invalid input.
```

when more useful guidance is available.

---

## 38.33 Error Association

Validation messages should be programmatically associated with the relevant input.

The user must be able to determine which field contains the problem.

---

## 38.34 Error Summary

For long or complex forms, provide an error summary when useful.

The summary should:

```text
Identify Errors
Link to Fields
Help the User Navigate
```

---

## 38.35 Success Messages

Success states must communicate clearly what happened.

Example:

```text
Project created successfully.
```

Do not rely only on:

```text
Green Toast
Animation
Sound
```

---

## 38.36 Loading Accessibility

Loading states must communicate that an operation is in progress.

Example:

```text
Generating your videos…
```

Do not rely solely on a spinning animation.

---

## 38.37 Progress Accessibility

Long-running AI operations should expose meaningful progress information.

Example:

```text
Analyzing reference video
Planning scenes
Generating visuals
Rendering video
```

Progress must reflect actual system state whenever possible.

---

## 38.38 Progressbar Semantics

Where a progress indicator represents measurable progress, expose its state appropriately to assistive technology.

Do not provide a fake percentage merely to create the appearance of progress.

---

## 38.39 Indeterminate Progress

When exact progress is unavailable, communicate an indeterminate state.

Example:

```text
Generating video…
```

Do not invent:

```text
37%
64%
89%
```

without real underlying progress.

---

## 38.40 Animation Accessibility

Animations must not be required to understand or operate the application.

The interface must remain understandable when motion is reduced or disabled.

---

## 38.41 Reduced Motion

The application should respect:

```text
prefers-reduced-motion
```

where supported.

When reduced motion is enabled:

```text
Large Transitions
Parallax
Excessive Movement
Continuous Animation
```

should be reduced or removed where appropriate.

---

## 38.42 Animation Safety

Avoid unnecessary:

```text
Flashing
Rapid Pulsing
Aggressive Motion
Continuous Visual Noise
```

especially when it provides no functional benefit.

---

## 38.43 Video Accessibility

Video interfaces should support accessibility where applicable.

Generated videos should support:

```text
Captions
Accessible Controls
Play / Pause
Volume
Seek
Fullscreen
```

when technically supported by the media experience.

---

## 38.44 Audio Accessibility

Important information must not be communicated exclusively through audio.

If audio communicates essential content, provide an appropriate visual or textual alternative.

---

## 38.45 Captions

Where spoken content is presented as part of the application experience, captions should be available when appropriate.

Captions must remain readable and should not depend exclusively on color.

---

## 38.46 Media Controls

Video controls must be:

```text
Keyboard Accessible
Touch Accessible
Visible When Needed
Clearly Labeled
```

Icon-only media controls must have accessible names.

---

## 38.47 Image Accessibility

Every meaningful image must have appropriate alternative text.

The alt text should describe the image's purpose, not unnecessarily describe every visual detail.

---

## 38.48 Decorative Images

Purely decorative images should not create unnecessary screen-reader noise.

Decorative imagery should be appropriately marked so assistive technology can ignore it when suitable.

---

## 38.49 Image Text

Do not place important text inside images when the same information can be represented as actual text.

If text must exist inside an image, provide an accessible equivalent.

---

## 38.50 Background Images

Background images must not contain essential information that cannot be accessed through normal page content.

---

## 38.51 Contrast

Text and essential interface elements must maintain sufficient contrast against their backgrounds.

The AI must validate contrast across:

```text
Text
Icons
Buttons
Borders
Inputs
Focus States
Disabled States
Images
Gradients
```

---

## 38.52 Contrast With Images

Text placed over images must remain readable.

If necessary, use:

```text
Overlay
Gradient
Solid Surface
Shadow
Text Container
```

to maintain readability.

Do not sacrifice accessibility to preserve a reference image exactly.

---

## 38.53 Disabled Controls

Disabled controls must remain understandable.

Do not use extremely low contrast for disabled elements if users still need to understand why the control is unavailable.

Where useful, explain why an action is unavailable.

---

## 38.54 Links

Links must visually and semantically behave like navigation.

Avoid making buttons behave like links or links behave like buttons without a legitimate reason.

---

## 38.55 Button vs Link

Use:

```text
Button
→ Performs an action

Link
→ Navigates somewhere
```

Do not use clickable text containers as substitutes.

---

## 38.56 Navigation Accessibility

Navigation must provide:

```text
Clear Labels
Current Location
Keyboard Access
Focus Visibility
Logical Order
```

The active page or destination should be programmatically identifiable where appropriate.

---

## 38.57 Current Navigation State

The active navigation item should communicate its state through more than color alone.

Use appropriate combinations of:

```text
Color
Background
Icon
Weight
Indicator
Accessible State
```

---

## 38.58 Mobile Accessibility

Mobile interfaces must support:

```text
Touch
Screen Readers
Keyboard where applicable
Zoom
Large Text
Orientation Changes
```

Do not create mobile-only interactions that become inaccessible.

---

## 38.59 Touch Accessibility

Touch targets must be sufficiently large and separated enough to prevent accidental activation.

Particular attention must be given to:

```text
Icon Buttons
Close Buttons
Navigation
Video Controls
Checkboxes
Radio Buttons
Switches
```

---

## 38.60 Zoom

The application must remain usable when the user increases browser or system text/page zoom.

Do not intentionally prevent normal zoom behavior.

---

## 38.61 Text Scaling

The interface must tolerate increased text size without:

```text
Clipping
Overlapping
Hidden Content
Broken Buttons
Unreadable Labels
```

---

## 38.62 Responsive + Accessibility Interaction

Responsive transformations must preserve accessibility.

For example:

```text
Desktop Sidebar
      ↓
Mobile Drawer
```

must preserve:

```text
Navigation Meaning
Keyboard Access
Focus Management
Accessible Labels
Current Location
```

---

## 38.63 Screen-Specific Accessibility

Complex screens may require additional accessibility rules.

Examples:

```text
Video Editor
Campaign Planner
Analytics Dashboard
Generation Workspace
```

Each specialized screen must document:

```text
Keyboard Interaction
Focus Behavior
Screen Reader Behavior
Touch Behavior
Motion Behavior
Error Handling
```

---

## 38.64 Data Visualization Accessibility

Analytics charts must not communicate information through color alone.

Provide accessible alternatives such as:

```text
Labels
Values
Tables
Descriptions
Summaries
```

where appropriate.

---

## 38.65 Analytics Accessibility

Important analytics insights must remain understandable without requiring the user to visually interpret a chart.

Example:

```text
Top video received the highest number of views this week.
```

The chart may reinforce the information but should not be the only source.

---

## 38.66 Drag-and-Drop Accessibility

If Narrial uses drag-and-drop for:

```text
Campaign Ordering
Scene Ordering
Media Organization
```

an alternative interaction must be provided.

Users must not be forced to use drag-and-drop.

Possible alternatives:

```text
Move Up
Move Down
Move To
Keyboard Controls
Menu Actions
```

---

## 38.67 Keyboard Alternatives

Every important drag-and-drop operation should have an accessible keyboard or button-based alternative.

---

## 38.68 Focus During Dynamic Updates

When content changes dynamically, focus must remain logical.

Examples:

```text
New Video Generated
Modal Opens
Error Appears
Toast Appears
List Item Added
```

Do not unexpectedly move focus away from the user's current task.

---

## 38.69 Toast Accessibility

Important notifications must not exist only as temporary visual toasts.

Critical information should remain available long enough to understand and, where necessary, be accessible through another interface element.

---

## 38.70 Notifications

Notifications should communicate:

```text
What Happened
Severity
What The User Can Do
```

Example:

```text
Video generation completed.

[ Review Video ]
```

---

## 38.71 Destructive Actions

Destructive actions must be clearly identified.

Examples:

```text
Delete Project
Delete Video
Disconnect Account
Cancel Generation
```

The user must understand the consequence before confirming when appropriate.

---

## 38.72 Confirmation Dialogs

Confirmation dialogs should be used when an action is:

```text
Destructive
Difficult to Undo
Potentially Expensive
Potentially Irreversible
```

The dialog must clearly identify the action.

---

## 38.73 Accessibility of AI Questions

AI-generated questions must remain accessible.

Each question must provide:

```text
Clear Question
Context
Input
Required / Optional State
Validation
Next Action
```

Avoid presenting multiple ambiguous questions without clear structure.

---

## 38.74 Accessibility of AI-Generated Content

AI-generated content may contain unpredictable lengths.

The interface must remain usable when AI produces:

```text
Long Titles
Long Captions
Long Scripts
Long Names
Long Error Messages
Unexpected Text
```

Do not rely on fixed text widths.

---

## 38.75 Accessibility of Generation Status

Generation states must remain understandable through:

```text
Text
Status
Icon where useful
Progress
Action
```

not color alone.

---

## 38.76 Accessibility of Credit Warnings

Credit-related warnings must clearly communicate:

```text
Current Balance
Estimated Cost
What Will Happen
Required Action
```

Do not communicate an important credit warning solely through color.

---

## 38.77 Accessibility of Authentication

Authentication workflows must support:

```text
Keyboard Navigation
Accessible Labels
Password Visibility Controls
Clear Errors
Session Expiration Messages
Accessible Verification States
```

---

## 38.78 Accessibility of Onboarding

Onboarding must allow users to:

```text
Understand Each Question
Navigate Back
Navigate Forward
Correct Errors
Skip Optional Questions
Understand Progress
```

Do not create inaccessible step transitions.

---

## 38.79 Accessibility of Campaign Planner

Campaign planning interactions must not depend exclusively on drag-and-drop or visual positioning.

Users must have alternative controls for:

```text
Move
Reschedule
Replace
Approve
Remove
```

---

## 38.80 Accessibility of Brand Memory

Brand Memory controls must clearly communicate:

```text
Current Value
User-Defined Value
AI Suggestion
Learned Value
Temporary Override
```

Do not use only visual color or styling differences to communicate these states.

---

## 38.81 Accessibility of Settings

Settings must use clear:

```text
Labels
Descriptions
Grouping
Section Headings
Save States
Error States
Success States
```

Users must understand what each setting controls.

---

## 38.82 Accessibility of Authentication Errors

Authentication errors must not expose unnecessary security-sensitive information.

Messages should remain useful without revealing whether a protected account exists when that information should remain private.

---

## 38.83 Accessibility Testing

Accessibility testing must occur throughout development.

Recommended testing layers:

```text
Component Tests
Integration Tests
Automated Accessibility Tests
Keyboard Testing
Screen Reader Testing
Responsive Testing
Manual Usability Testing
```

---

## 38.84 Accessibility Test Matrix

Critical workflows must be tested for accessibility:

```text
Sign Up
Login
Onboarding
Create Project
Upload Video
Submit Video URL
Generate Videos
Monitor Generation
Review Video
Edit Video
Regenerate Scene
Connect Social Account
Schedule Publishing
View Analytics
Manage Credits
Billing
Settings
```

---

## 38.85 Manual Keyboard Test

For every major screen:

```text
[ ] Can reach every interactive element
[ ] Focus is always visible
[ ] Focus order is logical
[ ] No keyboard trap exists
[ ] Modal focus works
[ ] Drawer focus works
[ ] Menus work
[ ] Forms work
[ ] Errors can be reached
[ ] Dynamic content remains understandable
```

---

## 38.86 Screen Reader Test

For critical workflows verify:

```text
[ ] Page title is meaningful
[ ] Headings are logical
[ ] Landmarks are understandable
[ ] Buttons have names
[ ] Links have names
[ ] Inputs have labels
[ ] Errors are announced appropriately
[ ] Status changes are understandable
[ ] Dialogs are identified
[ ] Navigation state is understandable
```

---

## 38.87 Accessibility Quality Gate

Before approving any screen:

```text
[ ] Semantic HTML is used
[ ] Keyboard navigation works
[ ] Focus is visible
[ ] Focus order is logical
[ ] No keyboard trap exists
[ ] Interactive elements have accessible names
[ ] Icon-only buttons are labeled
[ ] Forms have labels
[ ] Required fields are clear
[ ] Errors are understandable
[ ] Errors are associated with inputs
[ ] Success states are understandable
[ ] Loading states are understandable
[ ] Progress states are meaningful
[ ] Color is not the only status indicator
[ ] Text contrast is acceptable
[ ] Focus contrast is acceptable
[ ] Images have appropriate alternatives
[ ] Decorative images are handled appropriately
[ ] Video controls are accessible
[ ] Captions are supported where appropriate
[ ] Animation can be reduced
[ ] No important information depends on hover
[ ] Touch targets are usable
[ ] Zoom remains functional
[ ] Large text does not break the layout
[ ] Responsive transformations remain accessible
[ ] Dynamic updates preserve logical focus
[ ] Destructive actions are understandable
[ ] Drag-and-drop has alternatives
[ ] Charts have accessible alternatives
[ ] Critical workflows are accessibility tested
```

---

## 38.88 Forbidden Accessibility Decisions

The AI must never intentionally implement:

```text
Invisible Focus Indicators
Keyboard-Only Traps
Mouse-Only Interactions
Hover-Only Critical Information
Color-Only Status
Icon-Only Unlabeled Controls
Unlabeled Inputs
Tiny Touch Targets
Unusable Modals
Inaccessible Drawers
Inaccessible Drag-and-Drop
Flashing Animations
Blocked Zoom
Clipped Text
Hidden Error Messages
Fake Progress Information
Image-Only Essential Text
Audio-Only Essential Information
```

---

## 38.89 Accessibility + Visual Fidelity

Accessibility must not unnecessarily destroy the reference design.

The AI should use:

```text
Semantic Structure
Accessible Labels
Invisible Assistive Descriptions
Proper Focus States
Accessible Interaction Layers
Responsive Adaptation
```

to preserve the visual design while improving accessibility.

When visual fidelity and accessibility conflict, the implementation must preserve the product's visual intent while choosing an accessible interaction.

---

## 38.90 Accessibility + AI Agent Rule

Whenever the AI generates a new screen, it must automatically evaluate:

```text
Structure
Keyboard
Focus
Screen Reader
Color
Contrast
Typography
Forms
Images
Video
Motion
Touch
Responsive Behavior
Dynamic State
Error State
```

before considering the screen complete.

The AI must not wait for the user to explicitly request accessibility improvements.

---

## 38.91 Accessibility Quality Definition

A screen is not considered complete merely because:

```text
It Looks Correct
```

It must also:

```text
Look Correct
+
Work Correctly
+
Respond Correctly
+
Remain Keyboard Accessible
+
Remain Screen-Reader Understandable
+
Remain Touch Accessible
+
Remain Responsive
+
Remain Understandable Without Color
+
Remain Usable With Reduced Motion
```

---

## 38.92 Final Accessibility Principle

> **Accessibility is part of Narrial AI's implementation architecture, not an optional visual enhancement. Every screen generated by the AI must be visually faithful, functionally complete, responsive, and accessible by default.**

The required implementation model is:

```text
REFERENCE DESIGN
       ↓
VISUAL STRUCTURE
       ↓
SEMANTIC STRUCTURE
       ↓
INTERACTION MODEL
       ↓
KEYBOARD ACCESS
       ↓
SCREEN READER ACCESS
       ↓
TOUCH ACCESS
       ↓
RESPONSIVE ADAPTATION
       ↓
ACCESSIBILITY VALIDATION
       ↓
PRODUCTION-READY SCREEN
```

**Every future Narrial AI screen must inherit these accessibility rules automatically unless a documented screen-specific requirement explicitly overrides them.**

# 39. Screen Reference Rules

## 39.1 Purpose

This section defines the mandatory rules for using reference images, screenshots, mockups, visual designs, and other screen references when implementing Narrial AI screens.

Reference images are the visual source for understanding how a screen should look.

They are **not** the complete functional specification.

The AI must convert the reference into a:

```text
Visual Implementation
+
Functional Implementation
+
Responsive Implementation
+
Accessible Implementation
+
Reusable Implementation
```

A reference image must never be treated as a simple image to reproduce.

---

## 39.2 Core Reference Principle

> **A reference image defines the intended visual experience; the AI must reconstruct the underlying interface structure, behavior, and functionality rather than simply reproducing the pixels.**

The AI must determine:

```text
Layout
Hierarchy
Components
Content
Interactions
States
Navigation
Responsive Behavior
Accessibility
```

from the reference and the existing application rules.

---

## 39.3 Reference Image Source of Truth

When a reference image is provided, the AI must use the following hierarchy:

```text
Current Explicit User Instruction
        ↓
AGENT.md
        ↓
Existing Application Architecture
        ↓
Approved Design System
        ↓
Screen-Specific Specification
        ↓
Reference Image
        ↓
AI Inference
```

The reference image must not override explicit functional requirements.

---

## 39.4 Reference Image Purpose

A reference image may communicate:

```text
Visual Hierarchy
Layout
Spacing
Typography
Color
Background
Images
Icons
Component Relationships
Navigation Placement
CTA Placement
Visual Density
Brand Identity
```

The AI must extract these properties before implementation.

---

## 39.5 Reference Image Is Not Functional Code

The AI must never assume that a visual element in a screenshot is merely decorative.

For every visible interactive-looking element, determine:

```text
What is it?
What does it do?
Where does it go?
What state does it have?
What happens after interaction?
```

Example:

```text
Login Button
    ↓
Login Screen

Create Project
    ↓
Create Project Flow

Profile
    ↓
Profile / Account Area

Settings
    ↓
Settings Screen
```

---

## 39.6 Functional Reconstruction

The AI must reconstruct functionality behind the reference.

If the reference contains:

```text
Button
Card
Navigation Item
Input
Dropdown
Tab
Icon
Video
Link
Menu
```

the implementation must use an appropriate functional component rather than a static visual representation.

---

## 39.7 No Static Screenshot Recreation

The AI must never implement a screen as:

```text
One Background Image
+
Invisible Click Areas
```

or:

```text
Screenshot
+
Overlayed Buttons
```

unless the user explicitly requests a static image.

Narrial AI screens must be real application interfaces.

---

## 39.8 Visual Element Identification

Before coding, identify every major visible element:

```text
Header
Logo
Navigation
Heading
Supporting Text
Buttons
Cards
Images
Icons
Inputs
Controls
Content Areas
Footer
Background Elements
```

The AI should understand the role of each element before implementing it.

---

## 39.9 Interactive Element Identification

The AI must identify elements that appear interactive even when the screenshot does not explicitly demonstrate their behavior.

Examples:

```text
Buttons
Links
Navigation Items
Tabs
Dropdowns
Cards
Video Controls
Profile Controls
Settings
```

Their behavior must be implemented according to the application architecture.

---

## 39.10 Reference Content

Text visible in the reference should be preserved accurately when it is part of the approved screen design.

Do not unnecessarily:

```text
Rewrite
Shorten
Expand
Paraphrase
Replace
```

reference content.

If content is unreadable or unavailable, use the screen specification or clearly defined product content rather than inventing unrelated copy.

---

## 39.11 Reference Typography

The AI must analyze:

```text
Font Family
Font Weight
Font Size
Line Height
Letter Spacing
Text Alignment
Text Hierarchy
```

The implementation must use the approved typography system.

If the exact font is unavailable, use the closest approved system font rather than introducing an arbitrary font.

---

## 39.12 Reference Color Extraction

The AI must identify:

```text
Primary Background
Secondary Background
Surface
Primary Text
Secondary Text
Border
Accent
CTA
Success
Warning
Error
```

Colors must map to Narrial's centralized color system.

Do not create one-off colors for a single screen without documenting them.

---

## 39.13 Reference Backgrounds

Backgrounds must be reconstructed using the appropriate implementation:

```text
Solid Color
Gradient
Image
Pattern
Blur
Glow
Layered Surface
```

Do not convert a background into a static screenshot when the effect can be implemented natively.

---

## 39.14 Reference Gradients

When a reference uses gradients, reproduce the visual intent using actual CSS or design-system gradient tokens.

The AI must identify:

```text
Direction
Colors
Stops
Opacity
Blur
Intensity
```

Do not approximate a gradient with an unrelated flat color.

---

## 39.15 Reference Images

Images must be implemented as actual media assets.

The AI must determine:

```text
Aspect Ratio
Crop
Position
Size
Border Radius
Overlay
Loading State
Fallback State
```

Do not use screenshots of images when the actual image asset is available.

---

## 39.16 Reference Icons

Icons must be implemented using the approved icon system.

The AI must determine:

```text
Icon Meaning
Size
Stroke / Weight
Color
Placement
Interaction
State
```

Do not replace a meaningful icon with arbitrary Unicode symbols or emoji.

---

## 39.17 Reference Logo

The Narrial logo must use the approved brand asset or approved logo implementation.

Do not redraw the logo manually unless explicitly instructed.

Do not distort the logo to fit a reference screenshot.

---

## 39.18 Reference Spacing

The AI must analyze relationships between:

```text
Elements
Sections
Containers
Buttons
Text
Images
Cards
Navigation
```

Spacing should be mapped to the centralized spacing system.

Avoid arbitrary pixel values when an existing spacing token provides the correct result.

---

## 39.19 Reference Alignment

The AI must preserve important alignment relationships.

Examples:

```text
Heading aligned with content
CTA aligned with text
Cards aligned to grid
Icons aligned with labels
Navigation aligned with content
```

Visual alignment should be treated as a system rather than individually positioning every element.

---

## 39.20 Reference Component Recognition

The AI must determine whether a visual element corresponds to an existing component.

Priority:

```text
Existing Component
        ↓
Existing Variant
        ↓
Reusable New Component
        ↓
Screen-Specific Component
```

Do not create duplicate components when an existing component already provides the required behavior.

---

## 39.21 Reference vs Existing Application

If the reference visually differs from an existing Narrial component, the AI must determine whether:

```text
Existing Component Can Be Styled
Existing Component Needs a Variant
New Component Is Required
Screen-Specific Override Is Required
```

The AI must not duplicate the entire component unnecessarily.

---

## 39.22 Reference Component Reuse

Reference implementation must follow the component reuse rules.

For example:

```text
Reference Button
        ↓
Approved Button Component
```

not:

```text
Reference Button
        ↓
New One-Off Button
```

unless the reference genuinely represents a new interaction pattern.

---

## 39.23 Reference Layout Reconstruction

The AI must reconstruct the layout hierarchy.

Example:

```text
Screen
├── Header
├── Main Content
│   ├── Hero
│   ├── Primary Action
│   └── Supporting Content
└── Footer
```

The implementation must preserve structural relationships rather than absolute screenshot coordinates.

---

## 39.24 Absolute Positioning

Absolute positioning may be used for:

```text
Decorative Elements
Overlays
Badges
Floating Controls
Intentional Layered Visuals
```

Do not use absolute positioning to manually recreate an entire screen.

Avoid:

```text
top: 183px
left: 427px
```

for ordinary content layout when Flexbox or Grid is appropriate.

---

## 39.25 Reference Dimensions

The screenshot's exact pixel dimensions must not automatically become application dimensions.

The AI must distinguish between:

```text
Reference Viewport
Component Dimensions
Responsive Rules
Actual Application Viewport
```

---

## 39.26 Reference Aspect Ratios

Preserve intentional aspect ratios for:

```text
Video
Images
Cards
Avatars
Media Containers
```

Do not distort media simply to match a screenshot.

---

## 39.27 Reference Shadows

The AI must identify:

```text
Shadow Depth
Blur
Spread
Opacity
Direction
```

and map them to the approved shadow system.

Avoid creating arbitrary shadows for every component.

---

## 39.28 Reference Borders

Analyze:

```text
Border Width
Color
Opacity
Radius
Placement
```

and use the approved border system.

---

## 39.29 Reference Radius

Rounded corners must map to approved radius tokens whenever possible.

Do not introduce many slightly different radius values.

---

## 39.30 Reference States

A single screenshot usually represents only one state.

The AI must infer and implement the complete state model where appropriate:

```text
Default
Hover
Focus
Active
Selected
Disabled
Loading
Error
Success
Empty
Processing
Completed
```

The reference represents the visual appearance of the shown state, not the entire state system.

---

## 39.31 Reference Interaction States

When a reference shows a selected or active element, determine:

```text
What caused the state?
What happens when it changes?
How is the state represented?
```

The state must be implemented functionally.

---

## 39.32 Reference Navigation

If navigation is visible in a reference:

```text
Logo
Navigation Item
Profile
Settings
Back
Menu
```

the AI must connect the navigation to the correct application routes or actions.

Navigation must not be static text.

---

## 39.33 Reference Buttons

Every button shown in a reference must have:

```text
Action
State
Loading Behavior
Disabled Behavior
Success / Error Behavior where relevant
```

The AI must not implement a button that only looks clickable.

---

## 39.34 Reference Forms

If the reference contains a form, the AI must implement:

```text
Input State
Validation
Error State
Loading State
Submission
Success State
Keyboard Behavior
Accessibility
```

The screenshot alone is not sufficient to define the complete form behavior.

---

## 39.35 Reference Cards

Cards must be treated as functional UI units when appropriate.

A card may support:

```text
Open
Select
Edit
Preview
Delete
Duplicate
Navigate
```

The correct behavior must be determined from the screen context.

---

## 39.36 Reference Media

If the reference contains video or audio, the implementation must use actual media functionality.

The AI must implement appropriate:

```text
Loading
Playback
Pause
Error
Thumbnail
Processing
Completed
```

states.

---

## 39.37 Reference Responsive Interpretation

A reference screenshot normally represents one viewport.

The AI must not assume that:

```text
Desktop Screenshot
=
Desktop Layout
=
Mobile Layout
```

Instead:

```text
Reference
   ↓
Visual Relationships
   ↓
Content Priority
   ↓
Responsive Rules
   ↓
Mobile / Tablet / Desktop Implementation
```

---

## 39.38 Reference Mobile Adaptation

If only desktop reference material exists, the AI must derive mobile behavior from:

```text
Responsive Rules
Component Rules
Content Priority
Interaction Requirements
Accessibility Rules
```

The AI must not invent an unrelated visual system.

---

## 39.39 Multiple Reference Images

When multiple reference images are provided, the AI must compare them before implementation.

Determine:

```text
Shared Design Tokens
Shared Components
Shared Navigation
Screen-Specific Components
Different States
Different Viewports
```

Shared patterns must become reusable system components.

---

## 39.40 Reference Image Conflicts

If two references conflict, use:

```text
Explicit User Instruction
        ↓
Latest Approved Reference
        ↓
AGENT.md
        ↓
Existing Application Rules
        ↓
Earlier Reference
```

Do not silently combine conflicting designs.

---

## 39.41 Reference Image Quality

The AI must account for limitations such as:

```text
Low Resolution
Compression
Missing Details
Unreadable Text
Unknown Font
Unknown Icon
Unknown Asset
```

Do not treat uncertain visual information as confirmed requirements.

---

## 39.42 Reference Image Inference

When something cannot be determined from the reference, the AI may infer a reasonable implementation only when:

```text
It Does Not Conflict With AGENT.md
It Does Not Conflict With Existing Architecture
It Preserves User Experience
It Uses Existing Components
It Remains Reversible
```

Important assumptions should be documented.

---

## 39.43 Reference Asset Matching

If the project already contains an asset that matches the reference:

```text
Existing Asset
      ↓
Use Existing Asset
```

Do not create a duplicate.

If the correct asset does not exist, use the approved asset-generation or asset-selection workflow.

---

## 39.44 Reference Image Fidelity

The implementation should reproduce the reference as accurately as practical in:

```text
Color
Typography
Spacing
Alignment
Scale
Composition
Component Shape
Visual Hierarchy
```

while still following:

```text
Functionality
Accessibility
Responsiveness
Performance
Component Reuse
```

---

## 39.45 Pixel Accuracy

Pixel-level comparison may be used during visual validation.

However, pixel accuracy must not be achieved through fragile implementation techniques such as:

```text
Screenshot backgrounds
Hardcoded coordinates
Excessive absolute positioning
Viewport-specific hacks
Duplicate components
```

---

## 39.46 Reference vs Functionality Rule

When visual reproduction and functionality appear to conflict:

```text
Preserve Visual Intent
+
Implement Real Functionality
```

Do not choose a static visual imitation simply because it is easier.

---

## 39.47 Reference vs Accessibility Rule

When a reference contains an inaccessible interaction:

```text
Reference Visual Intent
        +
Accessible Interaction
```

must be implemented.

The AI must preserve the appearance where practical while providing proper:

```text
Keyboard Access
Screen Reader Access
Focus
Labels
Touch Access
```

---

## 39.48 Reference vs Responsive Rule

When exact reference geometry cannot fit a viewport:

```text
Preserve:
Brand
Hierarchy
Meaning
Interaction
Visual Relationships

Adapt:
Size
Spacing
Columns
Navigation
Component Arrangement
```

---

## 39.49 Reference vs Performance Rule

The AI must not reproduce a visual effect in a way that creates unnecessary performance problems.

Prefer:

```text
CSS
SVG
Optimized Images
Lazy Loading
Efficient Components
```

over unnecessarily large assets or expensive browser operations.

---

## 39.50 Reference Implementation Process

Every reference-driven screen should follow:

```text
Reference Image
      ↓
Analyze
      ↓
Identify Visual Tokens
      ↓
Identify Components
      ↓
Identify Interactions
      ↓
Identify States
      ↓
Map To Existing System
      ↓
Implement
      ↓
Add Responsive Behavior
      ↓
Add Accessibility
      ↓
Connect Navigation
      ↓
Connect Functional Actions
      ↓
Validate Visually
      ↓
Validate Functionally
```

---

## 39.51 Reference Analysis Checklist

Before implementation:

```text
[ ] Viewport identified
[ ] Layout identified
[ ] Main sections identified
[ ] Components identified
[ ] Typography identified
[ ] Colors identified
[ ] Background identified
[ ] Images identified
[ ] Icons identified
[ ] Spacing identified
[ ] Borders identified
[ ] Radius identified
[ ] Shadows identified
[ ] Primary actions identified
[ ] Navigation identified
[ ] Interactive elements identified
[ ] Visible states identified
[ ] Responsive implications identified
[ ] Accessibility implications identified
[ ] Existing reusable components identified
```

---

## 39.52 Reference Implementation Checklist

After implementation:

```text
[ ] Screen visually matches reference
[ ] Real components are used
[ ] Real interactions are implemented
[ ] Navigation works
[ ] Buttons work
[ ] Forms work
[ ] Media works
[ ] Loading states work
[ ] Error states work
[ ] Success states work
[ ] Responsive behavior works
[ ] Accessibility works
[ ] No screenshot is used as the UI
[ ] No unnecessary duplicate components exist
[ ] No unnecessary hardcoded coordinates exist
[ ] Existing design tokens are reused
[ ] Existing assets are reused where appropriate
[ ] Functional behavior does not depend on future screens
```

---

## 39.53 Reference Validation

Every reference-driven screen must be validated at minimum for:

```text
Visual Fidelity
Functional Fidelity
Responsive Behavior
Accessibility
Interaction
Navigation
Performance
Component Reuse
```

A screen is not complete if it only passes visual comparison.

---

## 39.54 Reference Change Management

If the user provides a new reference for an existing screen:

```text
Existing Screen
      ↓
Compare New Reference
      ↓
Identify Changes
      ↓
Preserve Existing Functionality
      ↓
Update Visual Implementation
      ↓
Validate Again
```

Do not rebuild the entire application unnecessarily.

---

## 39.55 Reference Override Rule

A screen-specific reference may override global visual rules only when the difference is intentional and documented.

The override must not unnecessarily break:

```text
Accessibility
Responsiveness
Component Reuse
Performance
Application Navigation
```

---

## 39.56 Reference Documentation

Each reference-driven screen should maintain enough information for another AI agent or developer to understand:

```text
Reference Source
Reference Viewport
Screen Name
Screen Purpose
Visual Tokens
Components
Interactions
States
Responsive Behavior
Accessibility Requirements
Known Assumptions
Screen-Specific Overrides
```

---

## 39.57 AI Agent Rule

Whenever a screen reference is attached to a generation task, the AI must automatically:

```text
1. Inspect the reference.
2. Understand the visual hierarchy.
3. Identify reusable components.
4. Identify interactive elements.
5. Identify likely states.
6. Map the design to the existing application.
7. Implement real functionality.
8. Implement responsive behavior.
9. Implement accessibility.
10. Connect navigation and actions.
11. Validate against the reference.
12. Preserve the implementation for future screens.
```

The AI must not treat each reference as an isolated image-generation task.

---

## 39.58 Cross-Screen Consistency

When multiple screen references are provided over time, the AI must preserve consistency across:

```text
Colors
Typography
Icons
Buttons
Forms
Cards
Navigation
Spacing
Radius
Shadows
Motion
Responsive Behavior
Accessibility
```

A new screen must extend the existing design system rather than create a new design language.

---

## 39.59 Reference Memory

Once a reference has been implemented and approved, the resulting implementation becomes part of the existing application context.

Future screens should reuse:

```text
Approved Components
Approved Tokens
Approved Patterns
Approved Navigation
Approved Interactions
Approved Responsive Behavior
```

unless the user explicitly changes them.

---

## 39.60 Forbidden Reference Decisions

The AI must never:

```text
Use the screenshot as the application UI
Create fake clickable regions
Create buttons with no functionality
Create navigation that does nothing
Ignore mobile behavior
Ignore accessibility
Replace real components with images
Invent unrelated visual styles
Duplicate existing components unnecessarily
Hardcode entire screen geometry
Use excessive absolute positioning
Ignore existing application architecture
Ignore approved design tokens
Treat uncertain details as confirmed facts
Break existing workflows to match a screenshot
```

---

## 39.61 Final Reference Principle

> **Reference images are design instructions, not application implementations. Narrial AI must transform every approved reference into a real, reusable, responsive, accessible, connected, production-ready screen.**

The required model is:

```text
REFERENCE
    ↓
UNDERSTAND
    ↓
STRUCTURE
    ↓
REUSE
    ↓
IMPLEMENT
    ↓
CONNECT
    ↓
RESPOND
    ↓
ACCESS
    ↓
VALIDATE
    ↓
PRESERVE
```

**Every future Narrial AI screen generated from a reference must follow these rules automatically, while remaining connected to the existing application rather than being implemented as an isolated visual screen.**
# 41. Functional Implementation Rules

## 41.1 Purpose

This section defines the mandatory rules for converting every Narrial AI screen from a visual design or reference into a real, functional application screen.

The AI must never implement a screen as visual-only code.

Every screen must be treated as part of the complete Narrial AI application and must connect to the existing application structure, navigation, components, state, workflows, and future backend integration.

The objective is:

```text
Reference / Design
        ↓
Real UI
        ↓
Real Interaction
        ↓
Real Navigation
        ↓
Real State
        ↓
Real Workflow
        ↓
Backend-Ready Architecture
```

---

## 41.2 Core Functional Principle

> **Every visible interactive element must have a real purpose, a real interaction, and a defined resulting state or navigation behavior.**

The AI must never create:

```text
Fake Buttons
Fake Links
Fake Navigation
Fake Forms
Fake Progress
Fake Menus
Fake Tabs
Fake Modals
Fake Video Controls
Fake Settings
```

simply to make the screen look complete.

---

## 41.3 Functional Source of Truth

Functional implementation must follow:

```text
Current Explicit User Instruction
        ↓
AGENT.md
        ↓
Existing Application Architecture
        ↓
Existing Routes
        ↓
Existing Components
        ↓
Existing State / Workflows
        ↓
Screen Specification
        ↓
Reference Design
        ↓
Reasonable AI Inference
```

The AI must preserve existing functionality unless the user explicitly requests a change.

---

## 41.4 Existing Application Awareness

Before implementing a new screen, the AI must inspect the existing application structure.

It must determine:

```text
Existing Routes
Existing Screens
Existing Components
Existing Navigation
Existing State
Existing Hooks
Existing API Layer
Existing Types
Existing Utilities
Existing Assets
Existing Design Tokens
Existing Authentication
Existing Workflows
```

The AI must extend the application rather than create an isolated screen.

---

## 41.5 No Isolated Screen Rule

Every new screen must be connected to the application.

For example:

```text
Welcome Screen
      ↓
Login
      ↓
Dashboard
      ↓
Create Project
      ↓
Generation
      ↓
Results
```

The AI must understand these relationships even when only one screen is currently being generated.

---

## 41.6 Screen Completion Definition

A screen is complete only when:

```text
Visual Implementation
+
Functional Interaction
+
Navigation
+
State Management
+
Responsive Behavior
+
Accessibility
+
Error Handling
+
Loading Handling
+
Reusable Components
```

have been addressed appropriately.

---

## 41.7 Interactive Element Rule

Every interactive element must define:

```text
Action
Trigger
State Change
Result
Failure Behavior
Loading Behavior
```

Example:

```text
Login Button
    ↓
Validate Form
    ↓
Submit Authentication
    ↓
Loading
    ↓
Success → Dashboard
Failure → Error State
```

---

## 41.8 Button Functionality

Every button must perform an intentional action.

Examples:

```text
Create Project
→ Open project creation flow

Login
→ Submit authentication

Generate
→ Create generation job

Retry
→ Retry failed operation

Cancel
→ Cancel or close the current operation
```

A button must not exist only because it appears in the reference.

---

## 41.9 Link Functionality

Every navigation link must point to a valid application route or valid external destination.

Do not implement:

```text
href="#"
```

or empty navigation placeholders for production functionality.

If a destination does not yet exist, the AI must use the application's planned route structure rather than silently creating a dead link.

---

## 41.10 Navigation Connectivity

Navigation must work across the application.

Example:

```text
Welcome
   ↓
Login
   ↓
Dashboard

Dashboard
   ↓
Projects
   ↓
Project
   ↓
Generation
   ↓
Results
```

The AI must not require the user to wait for a future screen implementation before basic navigation can function.

---

## 41.11 Future Screen Awareness

If the destination screen has not yet been implemented, the AI must still establish the correct application route and navigation contract where appropriate.

Example:

```text
Current Screen
     ↓
/dashboard
```

The next screen can later be implemented at the same route without rewriting the current screen's navigation logic.

---

## 41.12 Route Naming

Routes must follow a consistent application convention.

Example:

```text
/auth/login
/auth/signup

/dashboard

/projects
/projects/:projectId

/generation/:jobId

/videos
/videos/:videoId

/campaigns
/publishing
/analytics
/brand
/billing
/settings
```

Actual routing must follow the existing application architecture.

Do not create inconsistent route naming for individual screens.

---

## 41.13 Navigation State

The application must preserve navigation context.

When a user moves between screens, the application should preserve relevant:

```text
Project
Campaign
Generation Job
Filters
Selected Item
Form State
```

where appropriate.

---

## 41.14 Back Navigation

Screens that form part of a workflow must provide an appropriate way to return to the previous logical context.

Back navigation must not unexpectedly reset important user state.

---

## 41.15 Form Functionality

Forms must be real forms.

A form must support:

```text
Input
Validation
Submission
Loading
Success
Error
Retry
Reset
```

where applicable.

Do not implement form fields as decorative elements.

---

## 41.16 Form Submission

Submitting a form must execute the intended application action.

Example:

```text
Create Project
     ↓
Validate
     ↓
Create Project State
     ↓
Navigate / Update UI
```

The architecture must remain ready for backend API integration.

---

## 41.17 Client Validation

Client-side validation should provide immediate feedback.

Examples:

```text
Required field
Invalid format
Invalid URL
Unsupported file
Invalid selection
```

Client validation improves UX but must never replace backend validation.

---

## 41.18 Backend Validation Boundary

Business-critical validation must eventually be enforced by the backend.

The frontend must not assume:

```text
Client validation = security
```

The backend remains authoritative for:

```text
Authorization
Credits
Permissions
Ownership
Generation Limits
Billing
Publishing
```

---

## 41.19 State Architecture

Every functional screen must distinguish between:

```text
UI State
Server State
Persistent State
Workflow State
```

Do not place every piece of state into one global store.

---

## 41.20 UI State

UI state includes:

```text
Modal Open
Selected Tab
Dropdown Open
Panel Visibility
Temporary Input
Expanded Section
```

This state should remain local whenever practical.

---

## 41.21 Server State

Server state includes:

```text
Projects
Videos
Campaigns
Analytics
Credits
Generation Jobs
User Profile
Social Accounts
```

Server state should be managed through the approved API/state architecture.

---

## 41.22 Workflow State

Long-running workflows may contain states such as:

```text
Draft
Queued
Processing
Paused
Completed
Partially Completed
Failed
Cancelled
```

The UI must represent actual workflow state rather than arbitrary visual states.

---

## 41.23 Persistent State

Persistent user preferences may include:

```text
Theme
Sidebar Preference
Editor Preference
Selected Workspace
User Settings
```

Persistent state must be stored using the approved application architecture.

---

## 41.24 Loading Behavior

Every asynchronous action must have an appropriate loading state.

Example:

```text
Submit
  ↓
Loading
  ↓
Success / Error
```

The UI must prevent accidental duplicate submissions where appropriate.

---

## 41.25 Loading State Must Be Functional

Loading indicators must represent an actual operation.

Do not display:

```text
Loading...
```

without an underlying state transition.

---

## 41.26 Error Handling

Every important asynchronous operation must define an error state.

Example:

```text
Request
   ↓
Failure
   ↓
Understandable Error
   ↓
Recovery Action
```

Where possible provide:

```text
Retry
Go Back
Edit
Cancel
Contact Support
```

depending on the situation.

---

## 41.27 Success Handling

Successful actions must result in an understandable state transition.

Example:

```text
Create Project
      ↓
Success
      ↓
Project Created
      ↓
Open Project
```

Avoid leaving the user on a screen with no indication that the action succeeded.

---

## 41.28 Empty States

Empty states must provide an actionable next step.

Example:

```text
No Projects Yet

[ Create Project ]
```

The user must understand:

```text
Why it is empty
What they can do
How to continue
```

---

## 41.29 Disabled States

Controls may be disabled when the action is genuinely unavailable.

Disabled states must not replace proper validation when the user needs to understand what is required.

Where appropriate, explain why the action cannot currently be performed.

---

## 41.30 Confirmation Rules

Confirmation should be used for actions that are:

```text
Destructive
Expensive
Difficult to Undo
Potentially Irreversible
```

Avoid unnecessary confirmation dialogs for ordinary actions.

---

## 41.31 Destructive Actions

Examples:

```text
Delete Project
Delete Video
Disconnect Social Account
Cancel Generation
Delete Campaign
```

must clearly communicate consequences.

---

## 41.32 Modal Functionality

Every functional modal must support:

```text
Open
Close
Confirm
Cancel
Keyboard Interaction
Focus Management
Loading
Error
Success
```

where applicable.

A modal must not exist only as a visual overlay.

---

## 41.33 Dropdown Functionality

Dropdowns must:

```text
Open
Close
Select
Reflect Current Value
Handle Keyboard Interaction
Handle Touch Interaction
```

where applicable.

---

## 41.34 Tabs

Tabs must change the displayed content.

Example:

```text
Overview
Analytics
Settings
```

Selecting a tab must produce a real state change.

---

## 41.35 Active and Selected States

Interactive controls must visually and programmatically communicate:

```text
Active
Selected
Focused
Disabled
Loading
```

where applicable.

---

## 41.36 Search Functionality

If a search field exists, the AI must determine its intended behavior.

Search may:

```text
Filter Existing Data
Query Backend
Navigate To Search Results
```

depending on the screen.

A search input must not be implemented as a decorative field.

---

## 41.37 Filter Functionality

Filters must actually modify the displayed data or query state.

Example:

```text
Platform → TikTok
      ↓
Results update
```

The selected filter must remain visible.

---

## 41.38 Pagination

If a screen contains large datasets, pagination or another scalable data-loading strategy must be considered.

Do not load unlimited records into the browser unnecessarily.

---

## 41.39 Infinite Scrolling

Infinite scrolling may be used where appropriate.

It must provide:

```text
Loading State
End-of-List State
Error Recovery
Accessible Navigation
```

---

## 41.40 File Upload Functionality

File upload interfaces must support:

```text
File Selection
Validation
Upload State
Progress where available
Success
Failure
Retry
Cancellation where supported
```

The UI must not assume an upload succeeded merely because a file was selected.

---

## 41.41 Video Upload

Video uploads must validate:

```text
File Type
File Size
Duration
Resolution
Processing State
```

before the application proceeds to downstream processing where appropriate.

---

## 41.42 Video URL Input

Submitting a reference video URL must:

```text
Validate URL
Submit Request
Process Reference
Show Processing State
Handle Failure
Continue Workflow
```

The UI must not treat the URL as successfully processed before backend confirmation.

---

## 41.43 Generation Functionality

The Generate action must connect to the generation workflow.

Conceptually:

```text
User Configuration
       ↓
Generation Request
       ↓
Job Creation
       ↓
Queue
       ↓
Processing
       ↓
Progress
       ↓
Result
```

The frontend must be prepared for asynchronous completion.

---

## 41.44 Generation Job Identity

Every generation operation must have a unique job identity.

The frontend should use the job identity to:

```text
Track Progress
Reconnect
Refresh State
Open Results
Retry
Recover From Navigation
```

---

## 41.45 Generation Progress

Progress must be based on real job states.

Example:

```text
Queued
   ↓
Analyzing
   ↓
Planning
   ↓
Generating
   ↓
Rendering
   ↓
Quality Check
   ↓
Completed
```

Do not invent fake percentages.

---

## 41.46 Partial Completion

If multiple videos are generated, individual failures must not automatically destroy successful results.

Example:

```text
10 Videos Requested

8 Completed
1 Failed
1 Processing
```

The UI must communicate each state separately.

---

## 41.47 Retry Functionality

Retry must operate on the correct scope.

Possible scopes:

```text
Entire Job
Individual Video
Individual Scene
Individual Operation
```

Do not retry an entire expensive workflow when only one component failed unless necessary.

---

## 41.48 Cancellation

Long-running operations should support cancellation where technically possible.

Cancellation must clearly communicate:

```text
Requested
Processing
Cancelled
Unable To Cancel
```

as appropriate.

---

## 41.49 Video Review Functionality

Generated video cards should connect to actual video records.

Actions such as:

```text
Preview
Edit
Regenerate
Download
Duplicate
Schedule
Publish
Delete
```

must perform real operations or navigate to real workflows.

---

## 41.50 Video Editing Functionality

Editing controls must modify actual project/video state.

Examples:

```text
Replace Voice
Replace Music
Replace Visual Style
Change Caption
Regenerate Scene
Change Hook
Change CTA
```

The UI must communicate whether the change:

```text
Updates Immediately
Creates a New Version
Starts a New Generation Job
Requires Confirmation
```

---

## 41.51 Versioning

When an edit creates a new generated version, the application should preserve the relationship between:

```text
Original
   ↓
Edited Version
   ↓
Regenerated Version
```

Do not silently overwrite important generated assets unless explicitly intended.

---

## 41.52 Autosave

Autosave may be used for appropriate editing workflows.

If implemented, the UI should communicate:

```text
Saving
Saved
Save Failed
```

The user must not be left uncertain about whether changes were stored.

---

## 41.53 Campaign Functionality

Campaign planner actions must affect actual campaign state.

Examples:

```text
Move Video
Change Date
Change Time
Replace Video
Approve
Schedule
Remove
```

must update the appropriate application state.

---

## 41.54 Publishing Functionality

Publishing must follow:

```text
Select Video
      ↓
Select Platform
      ↓
Select Account
      ↓
Configure Publishing
      ↓
Schedule / Publish
      ↓
Processing
      ↓
Published / Failed
```

The UI must distinguish between scheduled and published content.

---

## 41.55 Social Account Connection

Connecting a social account must use the approved authentication flow.

The frontend must represent:

```text
Not Connected
Connecting
Connected
Expired
Reconnecting
Disconnected
Error
```

The UI must not claim an account is connected before backend confirmation.

---

## 41.56 Analytics Functionality

Analytics screens must retrieve and display actual application/platform data when connected.

Filters must affect:

```text
Date Range
Platform
Campaign
Video
Content Type
```

where applicable.

---

## 41.57 Brand Memory Functionality

Brand Memory settings must represent actual stored values.

The UI must distinguish:

```text
User Defined
AI Suggested
AI Learned
Temporary Override
```

when those concepts exist in the application.

---

## 41.58 Credit Functionality

Credits must come from the authoritative backend state.

The frontend may display:

```text
Current Balance
Estimated Cost
Usage
Transactions
```

but must never independently calculate the authoritative balance.

---

## 41.59 Credit Reservation

For expensive operations:

```text
Check Balance
      ↓
Reserve Credits
      ↓
Execute Job
      ↓
Calculate Usage
      ↓
Finalize / Refund
```

The UI should communicate the relevant state without claiming success before the backend confirms it.

---

## 41.60 Authentication Functionality

Authentication screens must connect to the actual authentication architecture.

Examples:

```text
Sign Up
Login
Logout
Forgot Password
Reset Password
Email Verification
OAuth
```

must not be simulated with local-only flags in production.

---

## 41.61 Session Handling

The frontend must gracefully handle:

```text
Valid Session
Expired Session
Revoked Session
Unauthorized Request
Permission Change
Logout
```

The user must not remain on a protected screen with invalid authentication state.

---

## 41.62 Permission Handling

If a user does not have permission to perform an action:

```text
Hide
Disable
Explain
Request Permission
```

according to product requirements.

The frontend must never rely on UI hiding as the security boundary.

---

## 41.63 Workspace Context

If Narrial supports multiple workspaces, the current workspace must be explicit and consistent across:

```text
Projects
Videos
Campaigns
Credits
Analytics
Brand Memory
Publishing
Settings
```

Changing workspace must update the relevant application context.

---

## 41.64 Data Persistence

User actions that are expected to persist must use the appropriate persistence layer.

Do not use temporary component state for information that should survive:

```text
Navigation
Refresh
Session Reconnect
Application Restart
```

---

## 41.65 Refresh Resilience

Refreshing a page must not unnecessarily destroy important persistent workflow state.

Long-running generation jobs must remain trackable after refresh.

---

## 41.66 Reconnection Resilience

If a real-time connection is interrupted:

```text
Disconnect
    ↓
Reconnect
    ↓
Re-sync Current State
    ↓
Continue UI
```

The frontend must not assume that an event was received simply because the connection previously existed.

---

## 41.67 Duplicate Event Handling

Real-time events may arrive more than once.

The frontend must safely handle duplicate events without:

```text
Duplicate Videos
Duplicate Notifications
Duplicate State Changes
Duplicate Transactions
```

---

## 41.68 Out-of-Order Events

The frontend must not blindly apply stale events over newer state.

Use:

```text
Timestamp
Sequence
Version
Job State
```

where appropriate.

---

## 41.69 API-Ready Implementation

Even when the backend API is not yet connected, frontend implementation must be structured so API integration can be added without rewriting the UI.

Use:

```text
UI
 ↓
Feature Logic
 ↓
API Service / Data Layer
 ↓
Backend
```

rather than embedding fake data directly throughout components.

---

## 41.70 Temporary Mock Data

Mock data may be used during Phase 1 when backend APIs are unavailable.

However:

```text
Mock Data
```

must remain isolated from:

```text
UI Components
```

through an appropriate data/service layer.

The mock implementation must be replaceable with real API calls.

---

## 41.71 No Hardcoded Business Logic in UI

Do not hardcode business rules directly into presentation components.

Avoid logic such as:

```text
if userCredits < 10
```

spread across multiple components.

Business rules should live in the appropriate application layer.

---

## 41.72 No Provider Logic in UI

The frontend must not contain direct logic for:

```text
OpenAI
Anthropic
Google AI
Video Providers
Cloud Storage Providers
Social Platform APIs
Payment Providers
```

Provider-specific logic belongs behind backend abstractions.

---

## 41.73 API Error Mapping

Technical API errors must be translated into user-understandable UI states.

Example:

```text
Provider Timeout
        ↓
We couldn't finish this video.
        ↓
[ Retry ]
```

The technical error remains available in logs.

---

## 41.74 Functional Loading Prevention

When an action is already processing, prevent accidental duplicate operations.

Example:

```text
Generate
   ↓
Generating...
```

Do not allow repeated clicks to create duplicate jobs unless the product intentionally supports multiple jobs.

---

## 41.75 Idempotent Actions

Critical operations should be designed for safe retries and duplicate requests.

Examples:

```text
Create Generation Job
Publish Video
Charge Credits
Connect Account
Schedule Publishing
```

The frontend must cooperate with backend idempotency mechanisms where required.

---

## 41.76 Real-Time UI

Real-time updates should update the correct application state rather than directly manipulating arbitrary DOM elements.

Use the approved state architecture.

---

## 41.77 Notifications

Notifications must connect to actual application events.

Examples:

```text
Generation Completed
Generation Failed
Publishing Completed
Publishing Failed
Credits Low
Subscription Updated
```

Do not generate fake notifications simply to demonstrate UI behavior.

---

## 41.78 Functional Animations

Animations may communicate:

```text
Loading
Transition
Success
Progress
State Change
```

but must never replace the underlying state.

The application must work if animations are disabled.

---

## 41.79 Functional Accessibility

All functional interactions must remain accessible through:

```text
Keyboard
Touch
Screen Reader
```

where applicable.

Functionality must never depend solely on hover or visual positioning.

---

## 41.80 Functional Responsive Behavior

When responsive layout changes:

```text
Desktop Navigation
      ↓
Mobile Drawer
```

the same underlying navigation function must remain available.

Responsive transformation must change presentation, not application meaning.

---

## 41.81 Functional Component Reuse

Reusable components must expose behavior through clear interfaces.

Example:

```text
Button
Modal
Input
Select
VideoCard
GenerationProgress
```

must not contain screen-specific business logic unless explicitly designed as a feature component.

---

## 41.82 Component Ownership

Each functional behavior should have a clear owner.

Example:

```text
Authentication
→ Auth Feature

Generation
→ Generation Feature

Publishing
→ Publishing Feature

Billing
→ Billing Feature
```

Avoid duplicating the same workflow logic across screens.

---

## 41.83 Cross-Screen Workflow Rule

The AI must think beyond the current screen.

When implementing:

```text
Screen 01
```

it must understand how that screen connects to:

```text
Screen 02
Screen 03
Screen 04
...
```

even if those screens are implemented later.

The current implementation must not create architectural decisions that make future screens difficult to connect.

---

## 41.84 Screen Independence

A screen must be independently functional where possible.

It must not depend on the AI generating the next screen before its own:

```text
Navigation
Validation
Interaction
State
Error Handling
```

can operate.

---

## 41.85 Missing Destination Handling

If a user clicks a valid action whose destination has not yet been implemented, the application should use the planned route architecture and provide an appropriate temporary state rather than a dead interaction.

Do not silently disable valid product flows merely because later screens are unfinished.

---

## 41.86 Functional Placeholder Rule

Temporary placeholders are permitted during development only when clearly isolated.

Example:

```text
Future API
Future Backend
Future Provider
```

must be represented through a replaceable abstraction.

Do not build temporary logic directly into permanent UI architecture.

---

## 41.87 Data Model Awareness

Frontend functionality must align with the application's data concepts.

Examples:

```text
User
Workspace
Project
Reference Video
Generation Job
Generated Video
Campaign
Social Account
Credit Transaction
```

Do not invent incompatible local data structures for each screen.

---

## 41.88 Functional Validation

Before completing a screen, test:

```text
[ ] Every button works
[ ] Every link works
[ ] Every navigation item works
[ ] Every form works
[ ] Every input behaves correctly
[ ] Every modal works
[ ] Every dropdown works
[ ] Every tab works
[ ] Loading states work
[ ] Error states work
[ ] Success states work
[ ] Empty states work
[ ] Retry works where applicable
[ ] Back navigation works
[ ] Refresh behavior works
[ ] Responsive interaction works
[ ] Keyboard interaction works
[ ] Touch interaction works
[ ] Existing workflows remain intact
```

---

## 41.89 Functional Quality Gate

A screen must not be considered complete if:

```text
It Only Looks Correct
```

It must also:

```text
Navigate Correctly
Respond Correctly
Maintain State
Handle Errors
Handle Loading
Handle Success
Preserve User Input
Connect To Existing Workflows
Remain API-Ready
Remain Responsive
Remain Accessible
```

---

## 41.90 AI Agent Functional Execution Rule

Whenever the AI receives a new screen-generation task, it must automatically perform:

```text
1. Inspect existing application structure.
2. Inspect AGENT.md rules.
3. Inspect existing routes.
4. Inspect reusable components.
5. Inspect existing state and feature logic.
6. Understand the new screen.
7. Identify every interactive element.
8. Determine the intended action for each element.
9. Connect navigation.
10. Implement required state.
11. Implement loading states.
12. Implement error states.
13. Implement success states.
14. Implement responsive behavior.
15. Implement accessibility.
16. Keep API integration replaceable.
17. Test the complete interaction path.
18. Preserve compatibility with future screens.
```

The AI must not wait for the user to separately request these steps.

---

## 41.91 Forbidden Functional Decisions

The AI must never intentionally implement:

```text
Static Buttons
Dead Links
Fake Navigation
Fake Forms
Fake Loading
Fake Progress
Fake Notifications
Fake Authentication
Fake Generation
Fake Publishing
Fake Billing
Fake Credit Deduction
Hardcoded Production Data
Provider Logic Inside UI
Business Logic Scattered Across Components
Unreplaceable Mock APIs
Screen-Isolated Architecture
Broken Back Navigation
State Loss During Navigation
Duplicate Job Creation From Repeated Clicks
```

unless the user explicitly requests a temporary prototype behavior.

---

## 41.92 Final Functional Principle

> **Every Narrial AI screen must be implemented as a real part of the application, not as an isolated visual reproduction.**

The required model is:

```text
DESIGN
   ↓
COMPONENTS
   ↓
INTERACTION
   ↓
STATE
   ↓
NAVIGATION
   ↓
WORKFLOW
   ↓
DATA LAYER
   ↓
API-READY ARCHITECTURE
   ↓
RESPONSIVE + ACCESSIBLE UI
   ↓
VALIDATION
   ↓
PRODUCTION-READY SCREEN
```

**Whenever a new screen is generated, the AI must automatically connect its interactions, navigation, state, and workflow to the existing Narrial AI application so that the screen is functional immediately and does not depend on a future prompt to become usable.**


# 41. Functional Implementation Rules

## 41.1 Core Rule

Every Narrial AI screen must be a **real, functional application screen**, not a static visual reproduction.

```text
Design → UI → Interaction → State → Navigation → Workflow
```

## 41.2 Interactive Elements

Every interactive element must have a real purpose and working behavior.

This includes:

* Buttons
* Links
* Inputs
* Forms
* Tabs
* Dropdowns
* Modals
* Cards
* Navigation
* Media controls

No dead or decorative interactive elements.

## 41.3 Navigation

Every navigation action must connect to the correct existing or planned route.

The AI must not wait for a future screen prompt before establishing the correct navigation structure.

## 41.4 State

Functional screens must handle relevant:

```text
Default
Loading
Success
Error
Empty
Disabled
Selected
```

Long-running AI operations must use real workflow states.

## 41.5 Forms

Forms must include:

```text
Input → Validation → Submission → Loading → Success / Error
```

Client validation improves UX; backend validation remains authoritative.

## 41.6 Existing Application

Before implementation, the AI must inspect and reuse:

* Existing routes
* Components
* State
* Hooks
* API/data layers
* Design tokens
* Assets

Do not create duplicate architecture.

## 41.7 API-Ready Structure

When APIs are not yet connected, use a replaceable data/service layer.

```text
UI → Feature Logic → Data/API Layer → Backend
```

Mock data must never be permanently embedded throughout UI components.

## 41.8 Workflow Continuity

Every new screen must remain compatible with the complete Narrial workflow.

A screen must work independently and must not break previously implemented screens.

## 41.9 Persistence

Important user actions and workflow state must use the appropriate persistence layer and survive navigation or refresh when required.

## 41.10 Functional Validation

Before considering a screen complete, verify:

```text
[ ] Interactions work
[ ] Navigation works
[ ] State works
[ ] Loading works
[ ] Error handling works
[ ] Success handling works
[ ] Responsive behavior works
[ ] Accessibility works
[ ] Existing workflows remain intact
```

## 41.11 Forbidden

Never implement:

* Fake buttons
* Dead links
* Fake navigation
* Fake forms
* Fake progress
* Fake authentication
* Fake generation
* Fake publishing
* Screen-isolated functionality
* Hardcoded business logic in UI

**Every generated screen must function as an integrated part of the Narrial AI application from the moment it is implemented.**


# 42. Screen Connectivity Rules

## 42.1 Core Rule

Every Narrial AI screen must be connected to the existing application flow.

```text
Screen → Action → Route → Next Screen → Workflow
```

## 42.2 Navigation

The AI must connect all valid:

* Buttons
* Links
* Navigation items
* Back actions
* CTAs
* Cards

to the correct existing or planned routes.

## 42.3 Existing Routes

Always reuse existing routes before creating new ones.

Do not create duplicate routes for the same screen or workflow.

## 42.4 Screen-to-Screen State

Pass required context between screens, including:

```text
User
Workspace
Project
Video
Generation Job
Campaign
```

Do not unnecessarily lose user context during navigation.

## 42.5 Future Screens

If the next screen is not implemented yet, create the correct route and connection so the future screen can be added without changing the current screen.

## 42.6 Workflow Continuity

New screens must extend existing workflows rather than creating isolated flows.

```text
Existing Flow
      ↓
New Screen
      ↓
Next Workflow Step
```

## 42.7 Back Navigation

Back actions must return the user to the correct previous context without unnecessarily resetting their work.

## 42.8 Authentication Connectivity

Protected screens must respect authentication and workspace permissions.

Unauthenticated users must be redirected to the appropriate authentication flow.

## 42.9 Data Connectivity

Screens must use the approved state/data layer rather than passing large amounts of application data through unrelated components.

## 42.10 Validation

Before completing a screen, verify:

```text
[ ] All navigation works
[ ] All CTAs work
[ ] Back navigation works
[ ] Required state is preserved
[ ] Future routes are correctly connected
[ ] Existing workflows are not broken
[ ] Authentication rules are respected
```

**Every screen must behave as one connected part of the Narrial AI application, never as an isolated page.**
# 43. Navigation & Routing Rules

## 43.1 Core Rule

All Narrial AI navigation must use a consistent, predictable routing structure.

```text
Screen → Route → Screen
```

## 43.2 Route Reuse

Always reuse an existing route when the destination already exists.

Do not create duplicate routes for the same screen.

## 43.3 Route Naming

Routes must follow a consistent structure based on the application's feature architecture.

Example:

```text
/auth/login
/auth/signup
/dashboard
/projects
/projects/:projectId
/videos/:videoId
/generation/:jobId
/campaigns
/analytics
/settings
```

## 43.4 Navigation Methods

Use the application's approved routing mechanism.

Do not implement navigation through:

* Hardcoded URL manipulation
* Fake buttons
* Page reloads
* Screenshot overlays

## 43.5 Route Parameters

Use route parameters for resources that require context.

Examples:

```text
/projects/:projectId
/generation/:jobId
/videos/:videoId
```

## 43.6 Navigation State

Preserve necessary context when navigating between screens.

Do not unnecessarily lose:

```text
Workspace
Project
Video
Generation Job
Campaign
```

## 43.7 Protected Routes

Protected routes must verify authentication and required permissions.

Unauthenticated users must be redirected to the appropriate authentication screen.

## 43.8 Back Navigation

Back navigation must return to the correct logical context without unexpectedly resetting user work.

## 43.9 Deep Linking

Important screens should be directly addressable through their route when practical.

Refreshing a valid route must restore the appropriate screen state.

## 43.10 Future Routes

When a destination screen has not yet been implemented, establish its planned route consistently so future implementation does not require restructuring existing screens.

## 43.11 Route Errors

Invalid or unavailable routes must display an appropriate application error or not-found state.

Never leave users on a blank or broken screen.

## 43.12 Validation

Before completing a screen:

```text
[ ] Route is correct
[ ] Navigation works
[ ] Parameters work
[ ] Back navigation works
[ ] Protected routes are secured
[ ] Required state is preserved
[ ] Refresh/deep link works where applicable
[ ] Existing routes are not broken
```

**Navigation must remain consistent across the entire Narrial AI application and must never depend on isolated screen implementations.**


# 44. User Flow Integrity

## 44.1 Core Rule

Every screen must fit into a complete, logical Narrial AI user journey.

```text
User Action → Screen → Result → Next Step
```

## 44.2 Flow Continuity

The AI must understand what happens:

* Before the current screen
* On the current screen
* After the current screen

Do not implement screens as isolated pages.

## 44.3 User Intent

Each screen must clearly support the user's current goal.

The interface must always provide an obvious next action.

## 44.4 Workflow State

User progress must be preserved across screens.

Important context includes:

```text
User
Workspace
Project
Video
Generation Job
Campaign
```

## 44.5 Valid Transitions

Every major user action must lead to a valid application state or next step.

Avoid:

```text
Dead End
Broken Route
Unexpected Reset
Lost Data
Unclear Next Step
```

## 44.6 Error Recovery

When a flow fails, the user must have a clear recovery path.

```text
Error → Explain → Retry / Edit / Go Back
```

## 44.7 Authentication Flow

Authentication must connect correctly to protected application flows.

```text
Welcome → Login / Signup → Onboarding → Dashboard
```

## 44.8 Generation Flow

Generation workflows must remain connected:

```text
Create Project
→ Analyze
→ Configure
→ Generate
→ Progress
→ Results
→ Edit / Publish
```

## 44.9 Cross-Screen Consistency

New screens must not change established behavior, terminology, navigation, or workflow logic without explicit instruction.

## 44.10 Flow Validation

Before completing a screen, verify:

```text
[ ] Entry point is correct
[ ] User goal is clear
[ ] Main action works
[ ] Next step is valid
[ ] Required state is preserved
[ ] Errors have recovery paths
[ ] Back navigation works
[ ] Existing flow is not broken
```

**Every Narrial AI screen must strengthen the complete user journey rather than create an isolated interaction.**


# 45. Interaction-to-Function Mapping

## 45.1 Core Rule

Every interactive UI element must map to a defined application function.

```text
UI Element → User Action → Function → Result
```

## 45.2 Required Mapping

For every interactive element, identify:

```text
Element
Action
Function
Result
Next State / Screen
```

## 45.3 Common Mappings

| UI Element | Interaction | Function                    |
| ---------- | ----------- | --------------------------- |
| Button     | Click/Tap   | Execute defined action      |
| Link       | Click/Tap   | Navigate to route           |
| Input      | Type        | Update state                |
| Select     | Choose      | Update selected value       |
| Tab        | Click/Tap   | Change active view          |
| Card       | Click/Tap   | Open/select related content |
| Toggle     | Change      | Update setting              |
| Upload     | Select file | Start upload workflow       |
| Video      | Play        | Start media playback        |
| Menu       | Open        | Display available actions   |

## 45.4 No Unmapped Interactions

Do not create interactive-looking elements that have no defined behavior.

```text
Interactive UI
      ↓
Must Have Function
```

## 45.5 Existing Functions

Reuse existing application functions, handlers, hooks, and services before creating new ones.

Do not duplicate functionality for the same action.

## 45.6 State Updates

Interactions must update the correct state layer.

```text
UI Action → State / Service → UI Result
```

Do not manipulate unrelated components directly.

## 45.7 Navigation Mapping

Navigation interactions must map to valid application routes defined by the Navigation & Routing Rules.

## 45.8 Async Functions

For asynchronous actions, map the complete lifecycle:

```text
Action → Loading → Success / Error
```

## 45.9 Functional Validation

Before completing a screen:

```text
[ ] Every interactive element has a function
[ ] Every function produces the expected result
[ ] Navigation targets are valid
[ ] State updates correctly
[ ] Async actions show proper states
[ ] No duplicate functionality is created
```

**Every interaction must have a clear function; no UI element should exist only for appearance.**


# 46. State & Data Architecture

## 46.1 Core Rule

State and data must have clear ownership and must be managed through the appropriate application layer.

```text
UI → State → Data Layer → API / Backend
```

## 46.2 State Categories

Separate state into:

```text
Local UI State
Server State
Persistent State
Workflow State
```

## 46.3 Local UI State

Use local state for temporary interface behavior:

* Modals
* Tabs
* Dropdowns
* Temporary inputs
* Panel visibility
* Selection

Do not make local UI state globally available without need.

## 46.4 Server State

Server-owned data includes:

```text
User
Workspace
Projects
Videos
Generation Jobs
Campaigns
Analytics
Credits
Social Accounts
```

Treat the backend as the authoritative source.

## 46.5 Persistent State

Persistent preferences and data must use the approved persistence layer.

Examples:

```text
Theme
User Preferences
Workspace Selection
Saved Settings
```

## 46.6 Workflow State

Long-running workflows must use explicit states.

```text
Draft → Queued → Processing → Completed
                         ↘ Failed
```

The UI must reflect actual workflow state.

## 46.7 Data Flow

Data should move through predictable boundaries:

```text
Component
   ↓
Feature Logic
   ↓
State / Data Layer
   ↓
API
   ↓
Backend
```

Avoid direct database, provider, or infrastructure access from UI components.

## 46.8 Single Source of Truth

Do not maintain multiple independent copies of the same authoritative data.

Prefer:

```text
One Source → Multiple Views
```

## 46.9 State Synchronization

When server data changes, all relevant screens must receive the updated state through the approved state/data architecture.

Avoid manual synchronization between unrelated components.

## 46.10 Mock Data

During frontend development, mock data must be isolated behind the data layer and easily replaceable with real API responses.

## 46.11 Data Validation

Validate data at the appropriate boundary.

Frontend validation improves UX; backend validation remains authoritative.

## 46.12 State Persistence & Recovery

Important workflow state must survive navigation, refresh, and reconnection where required.

Long-running generation jobs must remain recoverable.

## 46.13 Forbidden

Do not:

* Store authoritative business data only in UI state.
* Duplicate server data unnecessarily.
* Put business logic inside presentation components.
* Access APIs directly from unrelated UI components.
* Hardcode production data into screens.
* Create separate state systems for the same feature.

## 46.14 Validation

Before completing a screen:

```text
[ ] State ownership is clear
[ ] Data source is defined
[ ] Server state is authoritative
[ ] Workflow state is handled
[ ] Persistence is handled where required
[ ] Mock data is replaceable
[ ] Existing state architecture is reused
[ ] No unnecessary duplication exists
```

**Every screen must use a predictable state and data architecture that keeps the UI connected to the real Narrial AI application.**


# 47. Mock Data & Prototype Rules

## 47.1 Core Rule

Mock data is allowed during frontend development, but it must behave like real application data and remain replaceable by API data.

```text
Mock Data → Data Layer → UI
                 ↓
              Real API
```

## 47.2 Mock Data Purpose

Mock data may be used to:

* Build screens before backend integration
* Test UI states
* Demonstrate workflows
* Validate interactions
* Prototype realistic user journeys

## 47.3 Data Layer Separation

Mock data must not be hardcoded throughout UI components.

Use a dedicated:

```text
Mock Data → Service / Repository → Feature → UI
```

## 47.4 Realistic Data

Mock data should reflect the expected production structure, including:

```text
Users
Projects
Videos
Generation Jobs
Campaigns
Credits
Analytics
Social Accounts
```

Use realistic values and states rather than meaningless placeholder text.

## 47.5 Mock vs Real API

The UI must not require major code changes when switching from:

```text
Mock API
```

to:

```text
Real API
```

Only the data/service implementation should change where possible.

## 47.6 Prototype Interactions

Prototype interactions must behave realistically.

Example:

```text
Generate
→ Processing
→ Completed
→ Results
```

Do not simulate only the final visual state.

## 47.7 Mock Limitations

Mock functionality must not be presented as real backend functionality.

Clearly keep provider, database, authentication, billing, and API behavior replaceable.

## 47.8 No Production Dependence

Production code must not depend on:

* Hardcoded mock data
* Temporary prototype flags
* Fake API responses
* Local-only business logic

unless explicitly approved.

## 47.9 Prototype Validation

Before moving from prototype to API integration:

```text
[ ] Mock data is isolated
[ ] Data structure matches expected API structure
[ ] Interactions work
[ ] States work
[ ] Navigation works
[ ] Mock layer can be replaced
[ ] No mock logic is embedded in UI
```

**Mock data accelerates frontend development but must never become the application's permanent data architecture.**

# 48. API-Ready Frontend Rules

## 48.1 Core Rule

Every frontend screen must be structured so real backend APIs can be connected without rebuilding the UI.

```text
UI → Feature Logic → API/Data Layer → Backend
```

## 48.2 API Separation

UI components must not contain direct API requests.

API communication must remain inside the approved API/data layer.

## 48.3 API Contracts

Frontend types must match the expected backend request and response structures.

Examples:

```text
CreateProjectRequest
CreateGenerationRequest
GenerationJob
GeneratedVideo
Campaign
CreditBalance
```

## 48.4 Loading & Error States

Every API operation must support, where applicable:

```text
Request → Loading → Success / Error
```

The UI must not assume an API operation succeeded before confirmation.

## 48.5 Authentication

Protected API requests must use the application's approved authentication mechanism.

Never expose:

```text
API Keys
Provider Credentials
Private Secrets
```

to the frontend.

## 48.6 Mock-to-API Replacement

Mock implementations must be replaceable with real API services without changing presentation components.

```text
Mock Service
      ↓
     UI

Real API Service
      ↓
     UI
```

## 48.7 API Error Handling

Backend errors must be converted into user-friendly UI states.

Technical errors must remain available through application logging.

## 48.8 Async Operations

Long-running operations such as:

```text
Video Analysis
Generation
Rendering
Publishing
```

must use job-based workflows rather than blocking the UI.

## 48.9 Data Synchronization

After API mutations, update or invalidate affected server state through the approved state-management system.

Avoid manually duplicating API data across components.

## 48.10 API-Ready Validation

Before completing a screen:

```text
[ ] API boundary is clear
[ ] Request/response types are defined
[ ] API calls are separated from UI
[ ] Loading state exists
[ ] Error state exists
[ ] Authentication is protected
[ ] Mock service is replaceable
[ ] Async workflows are supported
[ ] Server state can be synchronized
```

**The frontend must be API-ready from the beginning, even when backend integration is implemented later.**

# 50. Asset & File Organization Rules

## 50.1 Core Rule

All Narrial AI assets and files must follow a consistent, reusable, and predictable organization system.

```text
Asset → Correct Folder → Correct Naming → Reusable
```

## 50.2 Asset Categories

Organize assets by purpose:

```text
assets/
├── brand/
├── icons/
├── images/
├── illustrations/
├── videos/
├── audio/
├── fonts/
└── animations/
```

## 50.3 Screen Assets

Screen-specific assets should remain inside the relevant feature or screen structure when they are not reusable.

Reusable assets belong in shared asset directories.

## 50.4 Naming

Use clear, descriptive, consistent names.

Prefer:

```text
welcome-hero.webp
narrial-logo.svg
arrow-right.svg
empty-projects.webp
```

Avoid:

```text
image1.png
final2.png
newnew.svg
test.png
```

## 50.5 File Formats

Prefer optimized formats appropriate to the asset:

```text
SVG → Icons / Logos
WebP / AVIF → Images
MP4 / WebM → Video
Web Audio formats → Audio
WOFF2 → Fonts
```

## 50.6 Asset Reuse

Before adding a new asset, check whether an existing approved asset can be reused.

Do not create duplicate:

* Icons
* Logos
* Images
* Fonts
* UI assets

## 50.7 Asset References

Components must reference assets through the approved asset structure.

Avoid scattering raw file paths throughout components.

## 50.8 Optimization

Assets must be optimized for:

* Performance
* Appropriate resolution
* File size
* Responsive loading
* Caching

Large media must not be unnecessarily bundled into the application.

## 50.9 Generated Assets

AI-generated or temporary assets must be clearly separated from approved production assets.

Temporary assets must be removable without affecting the application.

## 50.10 File Ownership

Every production asset should have a clear purpose and owner:

```text
Brand
UI
Feature
Screen
System
```

## 50.11 Validation

Before completing a screen:

```text
[ ] Asset is correctly categorized
[ ] Existing asset was checked first
[ ] Naming is consistent
[ ] Format is appropriate
[ ] Asset is optimized
[ ] Path is reusable
[ ] Temporary files are separated
[ ] No duplicate asset was created
```

**All assets must remain organized, reusable, optimized, and easy for future AI agents or developers to locate and maintain.**


# 51. Environment & Configuration Rules

## 51.1 Core Rule

Environment-specific configuration must be separated from application code.

```text
Development → Staging → Production
```

## 51.2 Environment Separation

Each environment must have independent:

* API configuration
* Database configuration
* Storage configuration
* Authentication configuration
* AI provider configuration
* Social platform configuration
* Secrets
* Feature flags

## 51.3 Secrets

Never commit or expose:

```text
API Keys
Passwords
Tokens
Private Credentials
Database Secrets
Provider Secrets
```

Secrets must be managed through environment variables or approved secret-management systems.

## 51.4 Public vs Private Configuration

Only configuration explicitly safe for the client may be exposed to the frontend.

Private configuration must remain server-side.

## 51.5 Environment Files

Use the project's approved environment configuration structure.

Example:

```text
.env.local
.env.development
.env.staging
.env.production
```

Do not commit production secrets.

## 51.6 Configuration Access

Application code should access configuration through a centralized configuration layer rather than scattering environment-variable reads throughout components.

## 51.7 Feature Flags

Feature flags may control:

```text
Experimental Features
UI Changes
AI Features
Beta Workflows
```

Flags must have clear ownership and defaults.

## 51.8 Environment Safety

Never allow development code to accidentally connect to production resources.

Production configuration must require explicit deployment configuration.

## 51.9 Validation

Before deployment:

```text
[ ] Environment is correct
[ ] Required configuration exists
[ ] Secrets are protected
[ ] Public/private values are separated
[ ] Production resources are isolated
[ ] Feature flags are defined
[ ] No secrets are committed
```

**Configuration must remain secure, environment-specific, centralized, and replaceable without changing application logic.**

# 52. Security Rules

## 52.1 Core Rule

Security must be enforced by design across the entire Narrial AI application.

```text
UI → API → Authorization → Data / Service
```

## 52.2 Authentication

Protected application features must require valid authentication.

Handle:

* Login
* Logout
* Session expiration
* Unauthorized access

## 52.3 Authorization

Every protected action must verify:

```text
User → Workspace → Resource → Permission
```

Never rely only on frontend visibility or disabled buttons for security.

## 52.4 Secrets

Never expose or commit:

```text
API Keys
Tokens
Passwords
Private Credentials
Provider Secrets
```

Secrets must remain server-side.

## 52.5 Input Security

Treat all external input as untrusted.

Validate and sanitize:

* User input
* URLs
* Files
* API requests
* Webhook data
* Imported content

## 52.6 File Security

Uploaded files must be validated before processing or storage.

Check:

```text
File Type
File Size
Content
Processing Status
```

## 52.7 API Security

Protected APIs must use:

* Authentication
* Authorization
* Validation
* Rate limiting
* Secure error handling
* Request tracing

## 52.8 External Integrations

Verify authentication, permissions, and webhook signatures for external services.

Do not expose provider credentials to the frontend.

## 52.9 Data Protection

Users must only access data they are authorized to access.

Workspace and resource boundaries must be enforced server-side.

## 52.10 Error Security

User-facing errors must not expose:

```text
Secrets
Internal Stack Traces
Database Details
Provider Credentials
Internal Infrastructure
```

Detailed errors belong in secure logs.

## 52.11 Dependency Security

Production dependencies must be:

* Maintained
* Reviewed
* Scanned for known vulnerabilities
* Updated when required

## 52.12 Security Validation

Before completing a feature:

```text
[ ] Authentication enforced
[ ] Authorization enforced
[ ] Inputs validated
[ ] Secrets protected
[ ] Files validated
[ ] APIs protected
[ ] External integrations secured
[ ] Sensitive errors hidden
[ ] User data isolated
```

**Security must never depend on the frontend alone; the backend remains the final security boundary.**

# 53. Performance Rules

## 53.1 Core Rule

Narrial AI must feel fast, responsive, and efficient without sacrificing functionality or visual quality.

```text
Fast UI → Efficient Data → Optimized Assets → Scalable Processing
```

## 53.2 Frontend Performance

Optimize for:

* Fast initial load
* Minimal JavaScript
* Code splitting
* Lazy loading
* Efficient rendering
* Cached server state
* Optimized images and media

## 53.3 Media Performance

Large images, videos, and audio must not be unnecessarily loaded into memory.

Use:

```text
Optimized Assets
Responsive Loading
Lazy Loading
Streaming / Progressive Loading
```

where appropriate.

## 53.4 API Performance

Avoid unnecessary API requests.

Use:

* Caching
* Request deduplication
* Pagination
* Efficient queries
* Appropriate revalidation

## 53.5 State Performance

Do not cause unnecessary application-wide re-renders.

Keep local state local and update only the components that require changes.

## 53.6 Long-Running Operations

AI generation, rendering, analysis, and publishing must run asynchronously.

The UI must remain responsive while processing continues in the background.

## 53.7 Lists & Large Data

For large datasets, use appropriate:

```text
Pagination
Virtualization
Incremental Loading
Filtering
```

Do not load unlimited records into the browser.

## 53.8 Performance Monitoring

Monitor important metrics such as:

```text
Page Load
API Latency
Render Performance
Asset Size
Memory Usage
Generation Job Duration
```

## 53.9 Performance Validation

Before completing a feature:

```text
[ ] UI remains responsive
[ ] Assets are optimized
[ ] Unnecessary requests are avoided
[ ] Large data is handled efficiently
[ ] Long operations are asynchronous
[ ] No unnecessary re-renders
[ ] Mobile performance is acceptable
```

**Performance improvements must preserve the intended Narrial AI user experience and functionality.**

# 54. Testing Rules

## 54.1 Core Rule

Every Narrial AI feature must be tested for both **visual correctness and functional behavior**.

```text
UI → Interaction → State → Navigation → Workflow
```

## 54.2 Test Levels

Use appropriate testing at:

* Component level
* Feature level
* API contract level
* End-to-end level
* Accessibility level

## 54.3 Critical Workflows

Prioritize testing for:

```text
Authentication
Project Creation
Video Upload / URL
Generation
Generation Progress
Video Review
Editing
Campaigns
Publishing
Credits
```

## 54.4 Interaction Testing

Verify that:

```text
[ ] Buttons work
[ ] Links work
[ ] Forms submit correctly
[ ] Inputs validate
[ ] Navigation works
[ ] Modals work
[ ] Tabs work
[ ] Loading states work
[ ] Error states work
```

## 54.5 State Testing

Test important:

```text
Default
Loading
Success
Error
Empty
Disabled
Partial Completion
```

states where applicable.

## 54.6 Responsive Testing

Verify critical screens across:

```text
Desktop
Tablet
Mobile
```

and ensure interactions remain usable.

## 54.7 Regression Testing

New screen implementations must not break existing:

* Screens
* Routes
* Components
* Workflows
* State
* Navigation

## 54.8 Accessibility Testing

Verify:

* Keyboard navigation
* Focus behavior
* Labels
* Contrast
* Screen-reader compatibility
* Reduced-motion behavior where applicable

## 54.9 Test Before Completion

Before marking a screen or feature complete:

```text
[ ] Visual matches reference
[ ] Functionality works
[ ] Navigation works
[ ] States work
[ ] Responsive behavior works
[ ] Accessibility works
[ ] Existing functionality still works
[ ] No critical errors remain
```

**A screen is not complete when it only looks correct; it is complete when its required behavior has been verified.**


# 55. Browser & Physical Device Validation

## 55.1 Core Rule

Every Narrial AI screen must be validated in real browsers and, where applicable, on real physical devices.

```text
Code → Browser → Physical Device → Validate → Fix
```

## 55.2 Browser Validation

Test supported application flows in the approved browsers.

Verify:

* Layout
* Typography
* Colors
* Images
* Navigation
* Interactions
* Forms
* Media
* Loading states
* Error states

## 55.3 Responsive Validation

Validate the screen at realistic:

```text
Desktop
Laptop
Tablet
Mobile
```

viewport sizes.

Do not rely only on browser resizing.

## 55.4 Physical Device Validation

Where mobile behavior is required, test on real physical devices.

Verify:

* Touch interactions
* Scrolling
* Keyboard behavior
* Safe areas
* Orientation
* Media playback
* Navigation
* Performance
* Responsive layout

## 55.5 Device-Specific Issues

Do not assume that behavior in a desktop browser or simulator represents real-device behavior.

Investigate differences in:

```text
Touch
Screen Size
Pixel Density
Keyboard
Browser UI
Performance
Network
Media
```

## 55.6 Validation Priority

Prioritize testing of:

```text
Authentication
Navigation
Project Creation
Video Upload
Generation
Video Review
Editing
Campaigns
Publishing
```

## 55.7 Final Validation

Before marking a screen complete:

```text
[ ] Browser validated
[ ] Responsive layouts validated
[ ] Mobile behavior validated
[ ] Physical device tested where required
[ ] Touch interactions work
[ ] Media works
[ ] Navigation works
[ ] No major visual differences
[ ] No critical console/runtime errors
```

**A screen is production-ready only after it behaves correctly in its intended browser and device environments.**

# 56. Reference-to-Implementation Validation

## 56.1 Core Rule

Every reference-based screen must be compared against its implemented version before completion.

```text
Reference → Implementation → Compare → Fix → Validate
```

## 56.2 Visual Validation

Compare:

* Layout
* Spacing
* Typography
* Colors
* Background
* Icons
* Images
* Borders
* Radius
* Shadows
* Visual hierarchy

## 56.3 Functional Validation

Verify that the implementation also provides:

```text
[ ] Working interactions
[ ] Working navigation
[ ] Correct states
[ ] Correct forms
[ ] Responsive behavior
[ ] Accessibility
```

## 56.4 Fidelity Rule

Match the reference as closely as practical without using:

* Screenshot backgrounds
* Hardcoded screen coordinates
* Fake interactions
* Unnecessary one-off components
* Fixed viewport hacks

## 56.5 Difference Handling

When differences are found:

```text
Reference
   ↓
Identify Difference
   ↓
Determine Cause
   ↓
Fix Implementation
   ↓
Compare Again
```

Do not ignore visible differences without a valid reason.

## 56.6 Responsive Validation

A reference normally represents one viewport.

Validate that its visual intent remains correct across:

```text
Desktop
Tablet
Mobile
```

## 56.7 Final Validation

Before marking the screen complete:

```text
[ ] Visual match verified
[ ] Typography verified
[ ] Colors verified
[ ] Spacing verified
[ ] Assets verified
[ ] Interactions verified
[ ] Navigation verified
[ ] Responsive behavior verified
[ ] Accessibility verified
[ ] No screenshot-based implementation
```

**Reference fidelity must be validated together with real functionality, not separately from it.**

# 57. Forbidden Design Decisions

## 57.1 Core Rule

The AI must not introduce design decisions that conflict with Narrial AI's established visual system, UX principles, or existing screens.

## 57.2 Forbidden Visual Decisions

Do not introduce:

* Unapproved colors
* Random gradients
* Inconsistent typography
* Unapproved fonts
* Random shadows
* Inconsistent border radius
* Unnecessary borders
* Decorative elements without purpose
* Inconsistent spacing

## 57.3 Forbidden Layout Decisions

Do not:

* Change established layouts without reason
* Create unnecessary page structures
* Use fixed-position hacks to reproduce screenshots
* Hardcode coordinates for UI elements
* Break responsive behavior
* Duplicate existing layout systems

## 57.4 Forbidden Component Decisions

Do not create a new component when an approved reusable component already exists.

Do not duplicate:

```text id="9b7y2k"
Buttons
Inputs
Cards
Modals
Navigation
Icons
```

## 57.5 Forbidden Interaction Decisions

Do not create:

* Fake buttons
* Dead links
* Fake loading
* Fake progress
* Fake navigation
* Unnecessary popups
* Confusing interactions

## 57.6 Forbidden Reference Decisions

Never implement a reference image as:

```text id="p4t1u8"
Screenshot Background
Image Overlay
Hardcoded Coordinates
Static Fake UI
```

The reference must be converted into real responsive components.

## 57.7 Forbidden Architecture Decisions

Do not:

* Create isolated screen architecture
* Duplicate existing functionality
* Put business logic in presentation components
* Put provider logic in the frontend
* Introduce unnecessary dependencies
* Create unnecessary technologies or frameworks

## 57.8 Forbidden UX Decisions

Do not add complexity merely to make a screen look more advanced.

Prefer:

```text id="1c3j2r"
Simple
Clear
Consistent
Purposeful
```

over unnecessary visual or interaction complexity.

## 57.9 Final Rule

**If a design decision is not supported by the existing design system, product requirements, reference, or established application architecture, do not introduce it without explicit instruction.**

# 58. Forbidden Functional Decisions

## 58.1 Core Rule

The AI must not introduce functionality that conflicts with Narrial AI's established architecture, workflows, or product requirements.

## 58.2 Forbidden UI Functionality

Do not create:

* Fake buttons
* Dead links
* Non-functional forms
* Fake loading states
* Fake progress
* Fake notifications
* Fake authentication
* Fake navigation

## 58.3 Forbidden Data Decisions

Do not:

* Hardcode production data
* Store authoritative data only in UI state
* Duplicate server data unnecessarily
* Lose user data during navigation
* Create incompatible data structures

## 58.4 Forbidden API Decisions

Do not:

* Call APIs directly from unrelated UI components
* Expose API keys or secrets
* Hardcode provider credentials
* Create provider-specific frontend logic
* Make the UI dependent on fake API responses

## 58.5 Forbidden Workflow Decisions

Do not:

* Break existing user flows
* Create isolated workflows
* Skip required states
* Create duplicate generation jobs
* Bypass authentication
* Bypass permissions
* Claim success before confirmation

## 58.6 Forbidden State Decisions

Do not:

* Mix unrelated state systems
* Put business logic into presentation components
* Reset important workflow state unnecessarily
* Ignore loading, error, or empty states
* Treat mock state as permanent application state

## 58.7 Forbidden Navigation Decisions

Do not create:

* Dead routes
* Duplicate routes
* Broken back navigation
* Unexpected redirects
* Navigation that loses required context

## 58.8 Forbidden Prototype Decisions

Temporary prototype behavior must remain isolated and replaceable.

Do not allow mock functionality to become permanent architecture.

## 58.9 Final Rule

**Never sacrifice real functionality for visual completion. Every implemented feature must remain connected, predictable, testable, and compatible with the existing Narrial AI application.**


# 59. Change & Override Management

## 59.1 Core Rule

Changes must be controlled so new screen requirements do not unintentionally break the existing Narrial AI system.

```text
Existing Rule → Requested Change → Evaluate → Apply → Validate
```

## 59.2 Change Priority

When rules conflict, use:

```text
User's Latest Explicit Instruction
        ↓
Screen-Specific Override
        ↓
AGENT.md
        ↓
Existing Application Rules
        ↓
Default AI Decision
```

## 59.3 Screen Overrides

A screen may override a global rule only when the difference is intentional and required by the screen design or user instruction.

Overrides should remain limited to that screen or feature.

## 59.4 Existing Functionality

Visual changes must not remove or break existing functionality unless explicitly requested.

Preserve:

```text
Navigation
State
Interactions
Data Flow
Accessibility
Responsive Behavior
```

## 59.5 Component Changes

Before modifying a shared component, determine whether the change affects other screens.

Prefer:

```text
Existing Component
        ↓
Variant / Configuration
```

instead of creating a duplicate component.

## 59.6 Design Changes

When a new reference changes an established visual pattern:

```text
Compare → Identify Difference → Determine Scope → Update → Validate
```

Do not automatically change the entire application.

## 59.7 Functional Changes

When functionality changes, update all affected states, routes, components, and workflows consistently.

## 59.8 Breaking Changes

Before making a breaking change, identify affected:

* Screens
* Components
* Routes
* State
* Workflows
* API contracts

Do not silently introduce breaking changes.

## 59.9 Override Documentation

Important overrides must record:

```text
Screen / Feature
Changed Rule
Reason
Scope
Affected Components
```

## 59.10 Validation

After any significant change:

```text
[ ] Requested change applied
[ ] Existing rules preserved where applicable
[ ] No unrelated screens broken
[ ] Navigation works
[ ] State works
[ ] Responsive behavior works
[ ] Accessibility remains intact
[ ] Shared components remain consistent
```

**Changes should be intentional, scoped, reversible where possible, and validated against the existing Narrial AI system.**


# 60. Screen Implementation Workflow

## 60.1 Core Workflow

Every new Narrial AI screen must follow:

```text
Reference
→ Inspect Existing App
→ Understand Screen
→ Reuse Components
→ Implement UI
→ Connect Interactions
→ Connect Navigation
→ Connect State
→ Validate
```

## 60.2 Before Implementation

The AI must inspect:

* AGENT.md
* Existing routes
* Existing screens
* Reusable components
* Assets
* State/data architecture
* Existing workflows

## 60.3 Screen Analysis

Identify:

```text
Layout
Colors
Typography
Assets
Components
Interactions
States
Navigation
Data Requirements
```

## 60.4 Implementation

Build the screen using the existing:

* Design system
* Component architecture
* State architecture
* Routing system
* Asset structure

Do not create unnecessary duplicates.

## 60.5 Functional Connection

After the visual implementation, connect:

```text
Interactions
Navigation
State
Forms
Loading
Error
Success
```

Every interactive element must work.

## 60.6 API Readiness

If the backend is not connected:

```text
UI → Mock/Data Layer
```

must remain replaceable with:

```text
UI → API/Data Layer → Backend
```

## 60.7 Validation

Before completion:

```text
[ ] Visual reference matched
[ ] Interactions work
[ ] Navigation works
[ ] State works
[ ] Responsive behavior works
[ ] Accessibility works
[ ] Existing screens still work
[ ] API integration path is ready
```

## 60.8 Completion Rule

A screen is complete only when it is **visually accurate, functional, connected, responsive, reusable, and compatible with the existing Narrial AI application.**

# 61. Screen Completion Requirements

## 61.1 Core Rule

A screen is complete only when it is visually accurate, functional, connected, responsive, accessible, and ready for the next screen.

## 61.2 Required Completion Areas

Every screen must satisfy:

```text id="y2x6z9"
Visual
Functional
Navigation
State
Responsive
Accessibility
Performance
API-Ready
```

## 61.3 Visual Completion

Verify:

* Reference match
* Typography
* Colors
* Spacing
* Components
* Assets
* Responsive layout

## 61.4 Functional Completion

Verify:

```text id="6ax4p7"
[ ] Buttons work
[ ] Inputs work
[ ] Forms work
[ ] Interactions work
[ ] Loading works
[ ] Error works
[ ] Success works
```

## 61.5 Connectivity Completion

Verify:

```text id="m6kq3x"
[ ] Navigation works
[ ] Required state is preserved
[ ] Previous workflow remains intact
[ ] Next workflow step is connected
```

## 61.6 Technical Completion

Verify:

```text id="6a8y2p"
[ ] Existing components reused
[ ] No unnecessary duplication
[ ] API-ready structure exists
[ ] Mock data is isolated
[ ] No secrets exposed
[ ] No critical runtime errors
```

## 61.7 Validation

The screen must be checked in its intended:

```text id="2f5m6w"
Browser
Viewport
Device
```

where applicable.

## 61.8 Final Quality Gate

Do not mark the screen complete if it:

* Only looks correct
* Contains dead interactions
* Breaks existing navigation
* Loses important state
* Uses unnecessary duplicate components
* Cannot be connected to the backend later
* Breaks responsive or accessibility requirements

**A screen is complete only when it can become a permanent, connected part of the Narrial AI application without requiring structural rework.**


# 62. Final Validation Checklist

## 62.1 Core Rule

Every Narrial AI screen must pass the complete validation checklist before being marked complete.

## 62.2 Visual

```text
[ ] Matches reference
[ ] Colors correct
[ ] Typography correct
[ ] Spacing correct
[ ] Assets correct
[ ] Responsive layout correct
```

## 62.3 Functional

```text
[ ] Buttons work
[ ] Links work
[ ] Forms work
[ ] Interactions work
[ ] Loading works
[ ] Error works
[ ] Success works
[ ] Empty states work
```

## 62.4 Navigation & Flow

```text
[ ] Routes work
[ ] Back navigation works
[ ] Required state is preserved
[ ] User flow continues correctly
[ ] Existing workflows are not broken
```

## 62.5 Technical

```text
[ ] Existing components reused
[ ] No unnecessary duplication
[ ] State architecture is correct
[ ] Mock data is isolated
[ ] API-ready structure exists
[ ] No secrets exposed
[ ] No critical errors
```

## 62.6 Quality

```text
[ ] Browser validated
[ ] Mobile/responsive validated
[ ] Accessibility checked
[ ] Performance acceptable
[ ] Reference comparison completed
```

## 62.7 Final Decision

```text
PASS → Screen is complete
FAIL → Fix issues → Validate again
```

**Never mark a screen complete until all applicable validation requirements pass.**


# 63. Definition of Done

## 63.1 Core Rule

A Narrial AI screen is **Done** only when it is visually accurate, functional, connected, validated, and ready to remain part of the application.

## 63.2 Done Requirements

```text
[ ] Reference accurately implemented
[ ] Design system followed
[ ] All interactions work
[ ] Navigation works
[ ] User flow remains intact
[ ] Required state is handled
[ ] Loading / Error / Success states work
[ ] Responsive behavior works
[ ] Accessibility requirements met
[ ] Performance is acceptable
[ ] Existing components reused
[ ] No unnecessary duplication
[ ] Mock data isolated
[ ] API-ready architecture maintained
[ ] Browser validation completed
[ ] Physical-device validation completed where required
[ ] No critical errors remain
[ ] Existing screens and workflows still work
```

## 63.3 Final Standard

```text
Reference
   ↓
Implemented
   ↓
Functional
   ↓
Connected
   ↓
Validated
   ↓
PASS
```

If any applicable requirement fails:

```text
FAIL → Fix → Validate Again
```

**Done means production-quality and permanently integrated into the Narrial AI application, not simply visually complete.**

docs\frontend\screen-specs\colour-pallet.md