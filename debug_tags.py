import os
import sys

def check_vue_file(filepath):
    print(f"Checking {filepath}...")
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        template_start = content.find('<template>')
        template_end = content.rfind('</template>')
        
        if template_start == -1 or template_end == -1:
            print(f"  No template found in {filepath}")
            return
            
        template = content[template_start:template_end + 11]
        
        # Simple stack-based tag balancer
        import re
        tags = re.findall(r'<(/?)([a-zA-Z0-9-]+)[^>]*>', template)
        
        stack = []
        for is_close, tagname in tags:
            # Skip self-closing void tags
            if tagname in ['input', 'img', 'br', 'hr', 'link', 'meta', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop']:
                continue
            
            if not is_close:
                stack.append(tagname)
            else:
                if not stack:
                    print(f"  ERROR: Found closed tag </{tagname}> but stack is empty!")
                    return
                last = stack.pop()
                if last != tagname:
                    print(f"  ERROR: Tag mismatch! Expected </{last}> but found </{tagname}>")
                    return
        
        if stack:
            print(f"  ERROR: Unclosed tags remaining: {stack}")
        else:
            print(f"  OK: Tags balanced.")
            
    except Exception as e:
        print(f"  CRITICAL ERROR: {e}")

if __name__ == "__main__":
    files = [
        'resources/js/Pages/Auth/Login.vue',
        'resources/js/Pages/Auth/Register.vue',
        'resources/js/Pages/Auth/ForgotPassword.vue',
        'resources/js/Pages/Auth/ResetPassword.vue',
        'resources/js/Layouts/LegalLayout.vue'
    ]
    
    for f in files:
        check_vue_file(f)
