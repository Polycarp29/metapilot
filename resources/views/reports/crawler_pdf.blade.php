<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $sitemap->name }} - Crawler Report</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #334155;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #4f46e5;
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.8;
            font-size: 14px;
        }
        .summary {
            padding: 30px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: table;
            width: 100%;
        }
        .summary-item {
            display: table-cell;
            text-align: center;
            width: 20%;
        }
        .summary-item label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 5px;
        }
        .summary-item span {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
        }
        .content {
            padding: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f1f5f9;
            text-align: left;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            padding: 12px 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 12px 10px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-completed { background-color: #dcfce7; color: #166534; }
        .status-crawling { background-color: #dbeafe; color: #1e40af; }
        .status-discovered { background-color: #fef9c3; color: #854d0e; }
        .status-error { background-color: #fee2e2; color: #991b1b; }
        
        .url { font-weight: 700; color: #4f46e5; word-break: break-all; }
        .title { color: #1e293b; margin-top: 4px; display: block; }
        .footer {
            padding: 30px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
        }
    </Style>
</head>
<body>
    <div class="header">
        <h1>Sitemap Intelligence Report</h1>
        <p>{{ $sitemap->name }} ({{ $sitemap->filename }})</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <label>Total Links</label>
            <span>{{ $summary['total_links'] }}</span>
        </div>
        <div class="summary-item">
            <label>SEO Bottlenecks</label>
            <span style="color: {{ $summary['total_bottlenecks'] > 0 ? '#991b1b' : '#166534' }};">{{ $summary['total_bottlenecks'] }}</span>
        </div>
        <div class="summary-item">
            <label>Canonical Coverage</label>
            <span>{{ $summary['total_links'] > 0 ? number_format(($summary['canonical_count'] / $summary['total_links']) * 100, 1) : 0 }}%</span>
        </div>
        <div class="summary-item">
            <label>Avg Load Time</label>
            <span>{{ number_format($summary['avg_load_time'], 2) }}s</span>
        </div>
        <div class="summary-item">
            <label>Redirects</label>
            <span>{{ $summary['redirects_count'] }}</span>
        </div>
    </div>

    <div class="content">
        <table>
            <thead>
                <tr>
                    <th width="35%">Page Details</th>
                    <th width="10%">Status</th>
                    <th width="10%">Load Time</th>
                    <th width="45%">Intelligence & Audit Findings</th>
                </tr>
            </thead>
            <tbody>
                @foreach($links as $link)
                <tr>
                    <td>
                        <div class="url">{{ $link->url }}</div>
                        <span class="title" style="font-size: 10px; color: #64748b;">Title: {{ $link->title ?? 'N/A' }}</span>
                        @if($link->h1)
                            <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">H1: {{ Str::limit($link->h1, 80) }}</div>
                        @endif
                    </td>
                    <td>
                        <span class="status-badge status-{{ $link->status }}">
                            {{ $link->status }}
                        </span>
                    </td>
                    <td>{{ number_format($link->load_time, 2) }}s</td>
                    <td style="background-color: #f8fafc;">
                        <div style="margin-bottom: 6px;">
                            <span class="status-badge" style="background-color: {{ $link->url_slug_quality === 'good' ? '#dcfce7' : ($link->url_slug_quality === 'warning' ? '#fef9c3' : '#fee2e2') }}; color: {{ $link->url_slug_quality === 'good' ? '#166534' : ($link->url_slug_quality === 'warning' ? '#854d0e' : '#991b1b') }};">
                                Slug: {{ ucfirst($link->url_slug_quality ?? 'Unknown') }}
                            </span>
                            <span style="font-size: 9px; margin-left: 10px; color: #64748b;">HTTP {{ $link->http_status ?? 200 }} | {{ $link->is_canonical ? 'Canonical ✓' : 'Non-Canonical ⚠' }}</span>
                        </div>

                        @if(!empty($link->seo_bottlenecks))
                            <div style="font-size: 9px; line-height: 1.3;">
                                <strong style="color: #475569; display: block; margin-bottom: 2px; text-transform: uppercase; font-size: 8px;">SEO Bottlenecks:</strong>
                                <ul style="margin: 0; padding-left: 14px; color: #991b1b;">
                                    @foreach($link->seo_bottlenecks as $bottleneck)
                                        <li style="margin-bottom: 1px;">{{ $bottleneck['message'] ?? $bottleneck }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @else
                            <div style="font-size: 9px; color: #166534;">✓ No critical URL structure bottlenecks identified.</div>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Generated by Metapilot Sitemap Intelligence Hub &bull; {{ now()->toDateTimeString() }}
    </div>
</body>
</html>
