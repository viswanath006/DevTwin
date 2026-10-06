import cv2
import numpy as np
import math

def generate_video():
    width = 960
    height = 540
    fps = 24
    duration = 5 # seconds
    total_frames = fps * duration
    output_path = 'client/public/assets/code-bg.mp4'

    # MP4 codec
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Mock code snippets
    code_lines = [
        "const digitalTwin = createCodebaseModel(repo);",
        "await twin.parseAbstractSyntaxTrees({ polyglot: true });",
        "const blastRadius = analyzeChangeImpact(modifiedNodes);",
        "const rootCause = await twin.traceDefect('POST /api/login:500');",
        "const patch = await twin.synthesizeFix(rootCause);",
        "const assertionResults = await twin.verifySandboxed(patch);",
        "if (assertionResults.isVerified) { commitFix(patch); }",
        "graph.propagateStateChanges(['UserService', 'AuthAPI']);",
        "monitorArchitectureContractDrift(liveTopology, spec);",
        "auditSecurityVulnerabilities(owaspChecklist);",
        "export default function SoftwareTwinModel() { return twin; }",
        "const dependencies = resolveCrossModuleEdges(astNodes);",
        "twin.cacheDependencyGraph({ latencyMs: 0.4 });",
        "predictFailureCascades(affectedServices);",
    ]

    # Pre-calculate node positions for AST network
    np.random.seed(42)
    num_nodes = 24
    nodes = []
    for _ in range(num_nodes):
        nodes.append({
            'x': np.random.uniform(50, width - 50),
            'y': np.random.uniform(50, height - 50),
            'speed_x': np.random.uniform(-0.4, 0.4),
            'speed_y': np.random.uniform(-0.4, 0.4),
            'is_crimson': np.random.rand() > 0.65
        })

    for f in range(total_frames):
        # Base background: deep near-black #08090C (BGR: 12, 9, 8)
        frame = np.full((height, width, 3), (12, 9, 8), dtype=np.uint8)

        # Subtle dark grid
        grid_spacing = 40
        for x in range(0, width, grid_spacing):
            cv2.line(frame, (x, 0), (x, height), (18, 14, 12), 1)
        for y in range(0, height, grid_spacing):
            cv2.line(frame, (0, y), (width, y), (18, 14, 12), 1)

        # Faint floating code lines
        scroll_offset = (f / total_frames) * (len(code_lines) * 28)
        for i, line in enumerate(code_lines * 2):
            y_pos = int(60 + i * 28 - scroll_offset)
            if 0 < y_pos < height:
                alpha_factor = math.sin((y_pos / height) * math.pi) # fade at top and bottom
                gray_val = int(35 + 25 * alpha_factor)
                cv2.putText(frame, line, (40, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (gray_val, gray_val, gray_val), 1, cv2.LINE_AA)

        # Draw AST network connecting lines
        for i in range(num_nodes):
            for j in range(i + 1, num_nodes):
                n1 = nodes[i]
                n2 = nodes[j]
                # calculate positions with looping sinusoidal drift
                t_ratio = (f / total_frames) * 2 * math.pi
                x1 = n1['x'] + math.sin(t_ratio + i) * 15
                y1 = n1['y'] + math.cos(t_ratio + i) * 15
                x2 = n2['x'] + math.sin(t_ratio + j) * 15
                y2 = n2['y'] + math.cos(t_ratio + j) * 15

                dist = math.hypot(x1 - x2, y1 - y2)
                if dist < 160:
                    alpha = 1.0 - (dist / 160.0)
                    if n1['is_crimson'] or n2['is_crimson']:
                        # Red accent line (BGR: 40, 20, 160)
                        col = (int(30 * alpha), int(20 * alpha), int(140 * alpha))
                    else:
                        col = (int(45 * alpha), int(35 * alpha), int(30 * alpha))
                    cv2.line(frame, (int(x1), int(y1)), (int(x2), int(y2)), col, 1, cv2.LINE_AA)

        # Draw AST network nodes
        for i, n in enumerate(nodes):
            t_ratio = (f / total_frames) * 2 * math.pi
            x = int(n['x'] + math.sin(t_ratio + i) * 15)
            y = int(n['y'] + math.cos(t_ratio + i) * 15)

            if n['is_crimson']:
                # Pulsing crimson node
                pulse = 0.7 + 0.3 * math.sin(t_ratio * 2 + i)
                cv2.circle(frame, (x, y), int(4 * pulse) + 2, (30, 25, 220), -1, cv2.LINE_AA)
                cv2.circle(frame, (x, y), int(8 * pulse) + 4, (15, 10, 90), 1, cv2.LINE_AA)
            else:
                cv2.circle(frame, (x, y), 2, (75, 60, 50), -1, cv2.LINE_AA)

        # Dark vignette / overlay in the frame itself
        out.write(frame)

    out.release()
    print("Successfully generated background video at:", output_path)

if __name__ == '__main__':
    generate_video()
