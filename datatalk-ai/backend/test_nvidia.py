import os
from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI

api_key = os.getenv("NVIDIA_API_KEY")
print(f"Key: {api_key[:15]}...")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key
)

completion = client.chat.completions.create(
    model="z-ai/glm4.7",
    messages=[{"role": "user", "content": "Write a simple SQL: SELECT 1 as test"}],
    temperature=0.1,
    max_tokens=100,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}},
    stream=True
)

result = []
for chunk in completion:
    if not getattr(chunk, "choices", None):
        continue
    if not chunk.choices:
        continue
    delta = chunk.choices[0].delta
    content = getattr(delta, "content", None)
    if content:
        result.append(content)

print("✅ Response:", "".join(result).strip())
