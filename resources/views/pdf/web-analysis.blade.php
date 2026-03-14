<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web Analysis Report - {{ $organization->name }}</title>
    <style>
        @page { margin: 40px; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            line-height: 1.5;
            font-size: 12px;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header table { width: 100%; }
        .org-name { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.025em; }
        .report-title { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .site-label { font-size: 14px; color: #6366f1; font-weight: 700; }
        
        .summary-grid { width: 100%; margin-bottom: 30px; }
        .summary-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            width: 23%;
            vertical-align: top;
        }
        .stat-val { font-size: 20px; font-weight: 900; color: #0f172a; display: block; }
        .stat-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }

        .score-section {
            background: #f1f5f9;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            text-align: center;
        }
        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #ffffff;
            border: 5px solid #6366f1;
            display: inline-block;
            line-height: 80px;
            font-size: 28px;
            font-weight: 900;
            color: #4f46e5;
        }
        .score-hint { font-size: 11px; color: #64748b; margin-top: 10px; font-weight: 500; }

        .section-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #0f172a;
            margin-bottom: 15px;
            border-left: 4px solid #6366f1;
            padding-left: 10px;
        }

        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table.data-table th {
            background: #f8fafc;
            text-align: left;
            padding: 10px 12px;
            font-size: 9px;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }
        table.data-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .url-text { font-weight: 700; color: #334155; font-size: 11px; }
        .url-meta { font-size: 9px; color: #94a3b8; }
        .score-pill {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 900;
            font-size: 10px;
        }
        .score-high { background: #ecfdf5; color: #059669; }
        .score-mid { background: #fffbeb; color: #d97706; }
        .score-low { background: #fef2f2; color: #dc2626; }

        .tag {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 700;
            margin-right: 4px;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .tag-issue { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
        .tag-suggestion { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; }
        .tag-ad { background: #e0e7ff; color: #4338ca; }

        .footer {
            position: fixed;
            bottom: -20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td>
                    <div class="report-title">Web Intelligence Report</div>
                    <div class="org-name">{{ $organization->name }}</div>
                    @if($pixelSite)
                        <div class="site-label">Site: {{ $pixelSite->label }} ({{ $pixelSite->allowed_domain }})</div>
                    @else
                        <div class="site-label">Consolidated View: All Managed Sites</div>
                    @endif
                </td>
                <td style="text-align: right; vertical-align: top; color: #94a3b8; font-size: 10px;">
                    Generated on {{ $generatedAt }}
                </td>
            </tr>
        </table>
    </div>

    <div class="score-section">
        <div class="score-circle">{{ $overallScore }}</div>
        <div class="score-hint">OVERALL SEO HEALTH SCORE</div>
        <p style="font-size: 10px; color: #64748b; max-width: 400px; margin: 10px auto 0;">
            This score represents the weighted average of SEO visibility, schema health, and technical hygiene across your indexed pages.
        </p>
    </div>

    <table class="summary-grid">
        <tr>
            <td class="summary-card">
                <span class="stat-label">Sitemaps</span>
                <span class="stat-val">{{ $sitemaps->count() }}</span>
            </td>
            <td style="width: 2%"></td>
            <td class="summary-card">
                <span class="stat-label">AI Injections</span>
                <span class="stat-val">{{ $schemaStats->total_injections ?? 0 }}</span>
            </td>
            <td style="width: 2%"></td>
            <td class="summary-card">
                <span class="stat-label">JS Errors</span>
                <span class="stat-val">{{ $errorSummary->total ?? 0 }}</span>
            </td>
            <td style="width: 2%"></td>
            <td class="summary-card">
                <span class="stat-label">Schema Conflicts</span>
                <span class="stat-val">{{ $schemaStats->conflicts ?? 0 }}</span>
            </td>
        </tr>
    </table>

    <div class="section-title">Deep Page Intelligence</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 60%">Page Details</th>
                <th style="width: 15%; text-align: center;">Score</th>
                <th style="width: 25%; text-align: right;">Optimization Tags</th>
            </tr>
        </thead>
        <tbody>
            @foreach($analysisLinks as $link)
                <tr>
                    <td>
                        <div class="url-text">{{ parse_url($link->url, PHP_URL_PATH) ?: '/' }}</div>
                        <div class="url-meta">{{ parse_url($link->url, PHP_URL_HOST) }}</div>
                        
                        <div style="margin-top: 8px;">
                            @foreach($link->seo_bottlenecks ?? [] as $issue)
                                <span class="tag tag-issue">{{ $issue }}</span>
                            @endforeach
                            @foreach($link->schema_suggestions ?? [] as $sug)
                                <span class="tag tag-suggestion">{{ $sug }}</span>
                            @endforeach
                        </div>
                    </td>
                    <td style="text-align: center;">
                        @php $s = $link->cdn_insight['seo_score'] ?? 0; @endphp
                        <span class="score-pill {{ $s >= 80 ? 'score-high' : ($s >= 50 ? 'score-mid' : 'score-low') }}">
                            {{ $s }}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        @if($link->cdn_insight['is_ad_ready'] ?? false)
                            <span class="tag tag-ad">Google Ad Ready</span>
                        @endif
                        @if(!empty($link->seo_bottlenecks))
                            <div style="font-size: 8px; color: #ef4444; font-weight: 700;">Needs Attention</div>
                        @else
                            <div style="font-size: 8px; color: #10b981; font-weight: 700;">Healthy</div>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        MetaPilot Intelligence Systems — Confidential Analytics Report — Page 1
    </div>
</body>
</html>
